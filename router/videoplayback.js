'use strict'

const qs = require('querystring')
const base64 = require('base64url')
const handleError = require('../HandleError')
const request = require('request')

module.exports = (req, res) => {

    if (!req.query.hash) throw new Error()
    const upstream = JSON.parse(base64.decode(req.query.hash))

    delete req.query.hash

    const query = qs.stringify(req.query)
    const originVideo = {
        url: `${upstream.domain}/videoplayback?${query}`,
        cookie: upstream.cookie,
    }
    originVideo.cookie.push(process.env.COOKIE)
    const headers = Object.assign({}, req.headers, {
        cookie: originVideo.cookie
    })

    // do not let upstream know about host and referer
    delete headers.host
    delete headers.referer

    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
    console.log("NEW REQUEST FROM " + ip)
    const playback = request({
        url: originVideo.url,
        method: "GET",
        resolveWithFullResponse: true,
        headers: headers
    })

    playback.on('response', (response) => {
            res.statusCode = response.statusCode
            Object.keys(response.headers).forEach(key => {
                res.setHeader(key, response.headers[key])
            })
        })
        .on('error', handleError)
        .pipe(res)
    res.on('close', () => {
        console.log('REQUEST CLOSED FOR ' + ip)
        playback.destroy()
    })
}