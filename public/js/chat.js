const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormBtn = $messageForm.querySelector('button');
const $shareLocationBtn = document.querySelector('#share-location-btn');
const $messages = document.querySelector('#messages');

// Template
const messageTemplate = document.querySelector('#messages-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild;

    // get new message height
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // get visible height
    const visibleHeight = $messages.offsetHeight;

    // get chats height container
    const containerHeight = $messages.scrollHeight;

    // how far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    console.log('ts')
    console.log(containerHeight)
    console.log(newMessageHeight);
    console.log(scrollOffset)
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;   
    }

}

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('D MMM YYYY, h:mm:ss a')
    });

    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('D MMM YYYY, h:mm:ss a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormBtn.setAttribute('disabled', 'disabled');

    const message = $messageFormInput.value;

    socket.emit('sendMessage', message, (error) => {
        $messageFormBtn.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
    });
});

$shareLocationBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
        return alert('geolocation not support.');
    }

    $shareLocationBtn.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        }, () => {
            $shareLocationBtn.removeAttribute('disabled');
        });
    })
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});