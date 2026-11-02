#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { load } from 'cheerio'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const OUT_FILE = path.join(DATA_DIR, 'calendar.json')
const CACHE_DIR = path.resolve(process.cwd(), 'cache')
// Previously published data: reuse its coordinates so we only geocode new locations
const PREVIOUS_FILES = [OUT_FILE, path.resolve(process.cwd(), '../frontend/public/calendar.json')]

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

const CAL_URL = 'https://ucigravelworldseries.com/en/calendar/'
// Nominatim usage policy: identify the application and stay at max 1 request/second
const USER_AGENT = 'gw-fetcher/1.1 (+https://github.com/juri1212/gravel-world-series-map)'
const NOMINATIM_DELAY_MS = 1100

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchHtml(url) {
    const res = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': USER_AGENT } })
    return res.data
}

function parseEvents(html) {
    const $ = load(html)
    const items = []
    const seenIds = new Set()
    // Walk headings and calendar widgets in document order; each widget belongs to the
    // closest preceding heading like "Qualifier events for the 2027 season"
    let season
    $('.elementor-heading-title, .glz-eventscalendar-tiles').each((_, widget) => {
        if (!$(widget).hasClass('glz-eventscalendar-tiles')) {
            const seasonMatch = $(widget).text().match(/(20\d{2})\s+season/i)
            if (seasonMatch) season = seasonMatch[1]
            return
        }

        $(widget).find('.glz-event').each((i, el) => {
            const nameRaw = $(el).find('.event-name').text().trim()
            const link = $(el).find('a').attr('href') || ''
            const city = $(el).find('.event-city').text().trim()
            const date = $(el).find('.event-date').text().trim()
            const countryImg = $(el).find('.event-country img').attr('src') || ''
            const m = countryImg.match(/countries\/(\w+)\.(png|jpg|svg)/)
            const countryCode = m ? m[1].toUpperCase() : undefined
            const locationParts = []
            if (city) locationParts.push(city)
            if (countryCode) locationParts.push(countryCode)
            const locationText = locationParts.join(', ')
            // `nameRaw` can include the city on a new line; take the first line as the event name
            const nameLine = (nameRaw || '').split(/\r?\n/)[0].trim()
            // Stable id derived from the event page slug (falls back to position)
            const slug = link.replace(/\/+$/, '').split('/').pop()
            let id = `${season || 'x'}-${slug || i}`
            while (seenIds.has(id)) id += '-dup'
            seenIds.add(id)
            const name = nameLine || city || id
            items.push({ id, season, name, date, locationText, city, countryCode, link })
        })
    })
    return items
}

function loadPreviousCoords() {
    const coords = new Map()
    for (const file of PREVIOUS_FILES) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'))
            for (const ev of data.events || []) {
                if (ev.locationText && typeof ev.lat === 'number' && typeof ev.lon === 'number' && !coords.has(ev.locationText)) {
                    coords.set(ev.locationText, { lat: ev.lat, lon: ev.lon })
                }
            }
        } catch { /* file missing or invalid */ }
    }
    return coords
}

let lastRequestAt = 0

async function nominatimSearch(q, countryCode) {
    const params = new URLSearchParams({ format: 'json', limit: '1', q })
    if (countryCode) params.set('countrycodes', countryCode.toLowerCase())
    const key = Buffer.from(params.toString()).toString('hex').slice(0, 200)
    const cacheFile = path.join(CACHE_DIR, key + '.json')
    if (fs.existsSync(cacheFile)) {
        try {
            return JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
        } catch { /* refetch */ }
    }

    for (let attempt = 0; ; attempt++) {
        const wait = lastRequestAt + NOMINATIM_DELAY_MS - Date.now()
        if (wait > 0) await sleep(wait)
        lastRequestAt = Date.now()
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?${params}`, {
                headers: { 'User-Agent': USER_AGENT },
                timeout: 15000,
            })
            const body = res.data
            try { fs.writeFileSync(cacheFile, JSON.stringify(body), { mode: 0o644 }) } catch { /* ignore */ }
            return body
        } catch (e) {
            const status = e.response?.status
            if (attempt >= 3 || (status && status !== 429 && status < 500)) throw e
            const backoff = 5000 * 2 ** attempt
            console.warn(`  Nominatim ${status || e.code}, retrying in ${backoff / 1000}s`)
            await sleep(backoff)
        }
    }
}

// Location strings on the calendar are free text, e.g. "Monaco – Peille (MON)" or
// "Gatehouse of Fleet (Scotland)". Try progressively simpler variants.
function geocodeCandidates(city) {
    const out = []
    const add = s => {
        const v = (s || '').replace(/\s+/g, ' ').trim().replace(/^[,\s-]+|[,\s-]+$/g, '')
        if (v && !out.includes(v)) out.push(v)
    }
    add(city)
    const noParens = city.replace(/\([^)]*\)/g, '')
    add(noParens)
    for (const part of noParens.split(/\s+[–—-]\s+|\s*[–—]\s*/)) add(part)
    for (const part of noParens.split(',')) add(part)
    for (const part of noParens.split(/[-–—]/)) add(part)
    return out
}

async function geocode(ev) {
    for (const q of geocodeCandidates(ev.city || '')) {
        const g = await nominatimSearch(q, ev.countryCode)
        if (Array.isArray(g) && g[0]) return { lat: parseFloat(g[0].lat), lon: parseFloat(g[0].lon) }
    }
    return null
}

async function main() {
    console.log('Fetching calendar...')
    const html = await fetchHtml(CAL_URL)
    const events = parseEvents(html)
    if (!events.length) throw new Error('No events parsed — calendar page structure may have changed')

    const previous = loadPreviousCoords()
    console.log(`Found ${events.length} events (${previous.size} known locations), geocoding...`)
    const withGeo = []
    let missing = 0
    for (let i = 0; i < events.length; i++) {
        const { city, countryCode, ...ev } = events[i]
        const tag = `[${i + 1}/${events.length}]`
        if (!ev.locationText) {
            console.log(`${tag} Skipping geocode (no location): ${ev.name}`)
            withGeo.push(ev)
            missing++
            continue
        }
        const known = previous.get(ev.locationText)
        if (known) {
            withGeo.push({ ...ev, ...known })
            continue
        }
        try {
            console.log(`${tag} Geocoding: ${ev.locationText} (${ev.name})`)
            const coords = await geocode({ city, countryCode })
            if (coords) {
                withGeo.push({ ...ev, ...coords })
            } else {
                console.warn(`${tag} No geocode result for ${ev.locationText}`)
                withGeo.push(ev)
                missing++
            }
        } catch (e) {
            console.error(`${tag} Geocode failed for ${ev.locationText}:`, e.message)
            withGeo.push(ev)
            missing++
        }
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), events: withGeo }, null, 2))
    console.log(`Wrote ${OUT_FILE} (${withGeo.length} events, ${missing} without coordinates)`)
}

main().catch(err => { console.error(err); process.exit(1) })
