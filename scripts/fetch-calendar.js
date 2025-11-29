#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { load } from 'cheerio'
import pRetry from 'p-retry'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const OUT_FILE = path.join(DATA_DIR, 'calendar.json')
const CACHE_DIR = path.resolve(process.cwd(), 'cache')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

const CAL_URL = 'https://ucigravelworldseries.com/en/calendar/'

async function fetchHtml(url) {
    const res = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'gw-fetcher/1.0' } })
    return res.data
}

function parseEvents(html) {
    const $ = load(html)
    const items = []
    $('.glz-event').each((i, el) => {
        const nameRaw = $(el).find('.event-name').text().trim()
        const city = $(el).find('.event-city').text().trim()
        const date = $(el).find('.event-date').text().trim()
        const countryImg = $(el).find('.event-country img').attr('src') || ''
        const m = countryImg.match(/countries\/(\w+)\.(png|jpg|svg)/)
        const countryCode = m ? m[1].toUpperCase() : undefined
        const locationParts = []
        if (city) locationParts.push(city)
        if (countryCode) locationParts.push(countryCode)
        const locationText = locationParts.join(', ')
        const id = `ev-${i}`
        // `nameRaw` can include the city on a new line; take the first line as the event name
        const nameLine = (nameRaw || '').split(/\r?\n/)[0].trim()
        const name = nameLine || city || id
        items.push({ id, name, date, locationText })
    })
    return items
}

async function geocodeOnce(q) {
    const key = Buffer.from(q).toString('hex')
    const cacheFile = path.join(CACHE_DIR, key + '.json')
    if (fs.existsSync(cacheFile)) {
        try {
            return JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
        } catch (e) { }
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
    const res = await axios.get(url, { headers: { 'User-Agent': 'gw-fetcher/1.0' }, timeout: 15000 })
    const body = res.data
    try { fs.writeFileSync(cacheFile, JSON.stringify(body), { mode: 0o644 }) } catch (e) { }
    return body
}

async function geocodeWithRetry(q) {
    return pRetry(() => geocodeOnce(q), { retries: 2 })
}

async function main() {
    console.log('Fetching calendar...')
    const html = await fetchHtml(CAL_URL)
    const events = parseEvents(html)

    console.log(`Found ${events.length} events, geocoding...`)
    const withGeo = []
    for (let i = 0; i < events.length; i++) {
        const ev = events[i]
        if (!ev.locationText) {
            console.log(`[${i + 1}/${events.length}] Skipping geocode (no location): ${ev.name}`)
            withGeo.push(ev)
            continue
        }
        try {
            console.log(`[${i + 1}/${events.length}] Geocoding: ${ev.locationText} (${ev.name})`)
            const g = await geocodeWithRetry(ev.locationText)
            if (Array.isArray(g) && g[0]) {
                withGeo.push({ ...ev, lat: parseFloat(g[0].lat), lon: parseFloat(g[0].lon) })
            } else {
                withGeo.push(ev)
            }
            // be polite with Nominatim
            // await new Promise(r => setTimeout(r, 1000))
        } catch (e) {
            console.error(`[${i + 1}/${events.length}] Geocode failed for ${ev.locationText}:`, e.message)
            withGeo.push(ev)
        }
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), events: withGeo }, null, 2))
    console.log('Wrote', OUT_FILE)
}

main().catch(err => { console.error(err); process.exit(1) })
