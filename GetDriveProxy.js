var request = require('request-promise');


module.exports = (fileid, proxy) => {
    return (request({
        url: 'https://docs.google.com/get_video_info?docid=' + fileid,
        method: "GET",
        proxy: proxy,
        resolveWithFullResponse: true,
        headers: {
            'cookie': process.env.COOKIE,
            'user-agent': process.env.USER_AGENT
        },
    }))
}