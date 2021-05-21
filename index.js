'use strict'
import os from 'os'
import fs from 'fs'
import https from 'https'
import express from 'express'
import body from 'body-parser'
import fetch from 'node-fetch'
const destdir = process.env.UPTOBOX_DIR  ? process.env.UPTOBOX_DIR :
                (os.hostname().toUpperCase() === 'MATRIX') ? '/mnt/diskb/video/AVoir' : 
                'C:/Users/benze/Downloads'
const port = process.env.UPTOBOX_PORT 
const token = process.env.UPTOBOX_TOKEN
if (token && port) {
    let app = express()
    // start: number, end:number, url: url, dlurl:  url, filename: string 
    const files = {}
    
    function download(url, dlurl, dest, cb) {
        // on créé un stream d'écriture qui nous permettra
        // d'écrire au fur et à mesure que les données sont téléchargées
        const file = fs.createWriteStream(dest);
    
        // on lance le téléchargement
        const request = https.get(dlurl, (response) => {
            // on vérifie la validité du code de réponse HTTP
            if (response.statusCode !== 200) {
                return cb('Response status was ' + response.statusCode);
            }
            files[url].length = parseInt(response.headers['content-length'],10)
    
            response.on('data', chunk => {
                const metadata = files[url]
                if (metadata) {
                    // Update the received bytes
                    const curtime = Date.now()/1000
                    metadata.loaded += chunk.length
                    metadata.rate = metadata.loaded / (curtime - metadata.start)
                    metadata.left = (metadata.length - metadata.loaded) / metadata.rate 
                    //console.log(`${metadata.filename} loaded bytes = ${metadata.loaded}`)
                }
            })
    
            // écrit directement le fichier téléchargé
            response.pipe(file);
        
            // lorsque le téléchargement est terminé
            // on appelle le callback
            file.on('finish', () => {
                const metadata = files[url]
                if (metadata) {
                    // Update the received bytes
                    const curtime = 
                    metadata.end = Date.now()/1000
                    metadata.rate = metadata.length / (metadata.end - metadata.start)
                    metadata.left = 0
                    //console.log(`${metadata.filename} loaded bytes = ${metadata.loaded}`)
                }

                // close étant asynchrone,
                // le cb est appelé lorsque close a terminé
                file.close(cb);
            });
        });
    
        // check for request error too
        request.on('error', (err) => {
            fs.unlink(dest);
            cb(err.message);
        });
    
        // si on rencontre une erreur lors de l'écriture du fichier
        // on efface le fichier puis on passe l'erreur au callback
        file.on('error', (err) => {
            // on efface le fichier sans attendre son effacement
            // on ne vérifie pas non plus les erreur pour l'effacement
            fs.unlink(dest);
            cb(err.message);
        });
    }
    
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
            const filename = `${destdir}/${decodeURI(dlurl.replace(/^.*\//,''))}`
            files[url] = { start, end, url, dlurl, filename, loaded: 0 }
            download(url, dlurl, filename, msg => {
                console.log(`${url} downloaded to ${filename} `)
            })
            res.json({error: false , message: `Submitted`, value: null})
        }).catch(err =>
            res.json({error: false , message: `Fail to download ${url} due to ${err.toString()}`, value: null})
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
