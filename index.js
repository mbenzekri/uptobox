'use strict'
import os from 'os'
import express from 'express'
import body from 'body-parser'
import fetch from 'node-fetch'
import { download,normalizeDl } from './download.js'
import { files } from './global.js'

const destdir = process.env.UPTOBOX_DIR  ? process.env.UPTOBOX_DIR :
                (os.hostname().toUpperCase() === 'MATRIX') ? '/mnt/diskd/videos/AVoir' : 
                'C:/Users/benze/Downloads'
const port = process.env.UPTOBOX_PORT 
const token = process.env.UPTOBOX_TOKEN
if (token && port) {
    let app = express()
    app.use(body.json())
    
    app.get('/download/file', (req, res) => {
        const array = Object.keys(files).map(key => files[key]).reverse()
        res.json(array)
    })
    
    app.get('/download/file/:id', (req, res) => {
        const id = res.params.id
        const url = `https://uptobox.com/${id}`
        const metadata = files[url]
        metadata ? res.json(metadata) : res.status(404).json({error: true , message: `Unknown url : ${url} `, value: null})
    })
    
    app.post('/download/file', (req, res) => {
        const url = req.body.url.replace(/^http:/, 'https:');
        if (!url.startsWith("https://uptobox.com/")) return res.json({error: true , message: `"${url}" is not a valid uptobox url`, value:null})
        if (url in files) return res.json({error: true , message: `"${url}" already in download`, value:null})
        const arr =url.split(/\//)
        const filecode = arr[3]
        fetch(`https://uptobox.com/api/link?file_code=${filecode}&token=${token}`)
        .then((response) => {
            if (!response.ok) return res.json({error: true , message: `Unable to get download link from "${url}"`, value:null})
            return response.json()
        })
        .then(json => {
            if (json.statusCode !== 0) return res.json({error: true , message: `Uptobox API fail for "${url}" with error ${json.message}`, value:null})
            const start = Date.now()/1000
            const end = null
            const dlurl = json.data.dlLink
            const filename = decodeURI(dlurl.replace(/^.*\//,''))
            const target = normalizeDl(filename)
            files[url] = { start, end, url, dlurl, filename,target, loaded: 0 }
            download(url, dlurl, destdir,target, msg => {
                console.log(`${url} downloaded to ${filename} `)
            })
            res.json({error: false , message: `Submitted`, value: null})
        }).catch(err =>
            res.json({error: true , message: `Fail to download ${url} due to ${err.toString()}`, value: null})
        )
    })
    
    app.delete('/download/file/:id', (req, res) => {
        const id = req.params.id
        const url = `https://uptobox.com/${id}`
        delete files[url] 
        res.json({error:false, message:'success', value:null})
    })
    
    app.use('/site', express.static('./site'));
    
    let server = app.listen(port, () => {
      console.log(`server running at port http://localhost:${server.address().port}`)
    })
} else  {
    const f = _ => console.log(`Missing UPTOBOX_TOKEN or UPTOBOX_PORT env variable, please set and restart`)
    f()
    setInterval(f, 10*60*1000 ) // every 10min
}
