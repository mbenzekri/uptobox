# uptobox

## description

Uptobox download app for my raspberry pi.

I use my raspberrypi as a media server (using minidlna) to stream videos in my home network.
This application is installed on this RPI and accessible from any client from my home netwok
It allow copy past uptobox links and run download process (through uptobox API).
Downloaded files are directtly downloaded in my 'to see' media server directory.
Downloaded file are then streamable streamable from my Smart TV, VLC from PCs,phones an tablets.

Simple and that's all it do

- Thank's to [Stéphane](https://github.com/nephaste) who compiled this project for Qnap NAS users ou can find it at : [uptobox-apache82](https://www.myqnap.org/product/uptobox-apache82/)

## install

open terminal in the directory you want to install server

```bash
    mkdir uptobox
    git clone https://github.com/mbenzekri/uptobox.git uptobox
    cd uptobox
    npm install
```

## configuration

All configuration is done through following environnement variables:

- UPTOBOX_DIR: directory to receive downloaded files
- UPTOBOX_PORT: port for the server
- UPTOBOX_TOKEN: uptobox token API

to retreive an uptobox token for API calls goto [uptobox login](https://uptobox.com/my_account "uptobox login") (sign in)
and clic clipboard near "Token" entry to copy token in your clibboard and set your env var.

## run

open terminal in repo root directory an run

```bash
  node index.js
```

</pre>

## screenshot

- copy/past uptobox link in "Download from uptobox" text field 
- clic "Download" to submit the request
- download progress is displayed

![app screenshot](./site/screenshot.png  "app screenshot" )
