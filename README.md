# uptobox
Uptobox download app for my raspberry pi.

I use my raspberrypi as a media server (using minidlna) to stream videos in my home network.
This application is installed on this RPI and accessible from any client from my home netwok
It allow copy past uptobox links and run download process (through uptobox API).
Downloaded files are directtly downloaded in my 'to see' media server directory.
Downloaded file are then streamable streamable from my Smart TV, VLC from PCs,phones an tablets.

Simple and that's all it do

# screenshot
![app screenshot](/site/screenshot.png  | 700x300 )
- copy/past uptobox link in "Download from uptobox" text field 
- clic "Download" to submit the request
- download progress is displayed

# install

<pre>
  mkdir uptobox
  git clone https://github.com/mbenzekri/uptobox.git uptobox
  cd uptobox
  npm install
</pre>
