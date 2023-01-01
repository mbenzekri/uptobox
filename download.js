'use scrict';
import fs from 'fs'
import https from 'https'
import { files } from './global.js'

const cleanre = /^.+(\(\d{4}\)|S\d\dE\d\d)\.[^.]+$/ 
const filmre= /^(.+?)(\d{4})(.*)\.([^.]+)$/i 
const seriere= /^(.+?)(S\d\dE\d\d)(.*)\.([^.]+)$/i

export function download(url, dlurl, destdir,target, cb) {
    // on créé un stream d'écriture qui nous permettra
    // d'écrire au fur et à mesure que les données sont téléchargées
    const dest = `${destdir}/${target}`
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
        fs.unlink(dest,() => null);
        cb(err.message);
    });
}

export function normalizeDl(filename,console = null) {
    console?.log(`processing : ${filename}`)
    if (cleanre.test(filename)) {
        console?.log(`clean : ${filename}`)
        return clean
    } else if (seriere.test(filename)) {
        console?.log(`    serie: ${filename}`)
        const match = seriere.exec(filename)
        const name = match[1].replace(/[. ()]+/g," ").replace(/^[ -.]*/,"").replace(/[ -.]*$/,"")
        const vostfr = /vostfr/i.test(match[3]) ? " VOSTRF" : ""
        const clean =`${name} - ${match[2].toUpperCase()}${vostfr}.${match[4].toLowerCase()}`
        console?.log(`    clean: ${clean}`)
        return clean
    } else if (filmre.test(filename)) {
        console?.log(`    film: ${filename}`)
        const match = filmre.exec(filename)
        const name = match[1].replace(/[. ()]+/g," ").replace(/^[ -.]*/,"").replace(/[ -.]*$/,"")
        const vostfr = /vostfr/i.test(match[3]) ? " VOSTRF" : ""
        const clean =`${name} (${match[2].toUpperCase()})${vostfr}.${match[4].toLowerCase()}`
        console?.log(`    clean: ${clean}`)
        return clean
    }
    console?.log(`dirty unknown: ${filename}`)
    return filename
}

