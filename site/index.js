const urlbutton = document.getElementById('button')
const urlinput = document.getElementById('url')
const filesul = document.getElementById('files')
const msgdiv = document.getElementById('message')
const empty = `<tr><td colspan=8  style="text-align: center;" >Nothing loading actually</td></tr>`
filesul.innerHTML = empty
function bytesToSize(bytes, seperator = "") {
    const sizes = ['Bytes', 'Kb', 'Mb', 'Gb', 'Tb']
    if (bytes == 0) return 'n/a'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
    if (i === 0) return `${bytes}${seperator}${sizes[i]}`
    return `${(bytes / (1024 ** i)).toFixed(2)}${seperator}${sizes[i]}`
}
function download() {
    msgdiv.innerHTML = ''
    urlbutton.disabled = true
    const url = urlinput.value
    fetch('/download/file', {
        method: 'post',
        body: JSON.stringify({ url }),
        headers: { 'Content-type': 'application/json' }
    }).then(response => {
        if (!response.ok) throw `Unable submit download for "${url}"`
        return response.json()
    }).then(json => {
        if (json.error) throw json.message
        msgdiv.innerHTML = `file submitted`
        urlbutton.disabled = false
        refresh()
    }).catch(msg => {
        msgdiv.innerHTML = msg
        urlbutton.disabled = false
    })
}
function remove(url) {
    const id = url.replace(/^https?:.*\//, '')
    fetch(`/download/file/${id}`, {
        method: 'delete'
    }).then(response => {
        if (!response.ok) refresh()
        msgdiv.innerHTML = 'removed'
    }).catch(msg => {
        msgdiv.innerHTML = msg
    })
}
function reset() {
    msgdiv.innerHTML = ''
    return false
}
function refresh() {
    fetch('/download/file').then(response => {
        if (!response.ok) throw `Unable refresh file list status=${response.status}`
        return response.json()
    }).then(datas => {
        if (datas.length === 0) {
            filesul.innerHTML = empty
        } else {
            const lines = datas.map(item => `
                <tr>
                    <td style="text-align:center" ><sub>${Math.floor(item.loaded * 100 / item.length)}%</sub><br><progress max="100" value="${Math.floor(item.loaded * 100 / item.length)}"> ${Math.abs(item.loaded * 100 / item.length)}% </progress></td>
                    <td>${bytesToSize(item.rate)}/s</td>
                    <td>${format_sec(item.left)}</td>
                    <td>${bytesToSize(item.loaded)}</td>
                    <td>${bytesToSize(item.length)}</td>
                    <td><button ${item.end ? '' : 'disabled'} onclick="remove('${item.url}')" class="pure-button" >x</button></td>
                    <td>${item.target}</td>
                    <td>${item.url}</td>
                </tr>`)
            filesul.innerHTML = lines.join('\n')
        }
    }).catch(msg => {
        filesul.innerHTML = msg
    })
}
function format_sec(secs) {
    const date = new Date(0)
    date.setSeconds(isNaN(secs) ? 0 : Math.floor(secs))
    switch (true) {
        case secs >= 3600: return date.toISOString().substr(11, 8)
        case secs >= 60: return date.toISOString().substr(14, 5)
        default: return date.toISOString().substr(17, 2) + 's'
    }
}


setInterval(refresh, 5000)