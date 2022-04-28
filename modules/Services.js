var accessToken = ""
const request = require('request');
const { url } = require('inspector');
const fs = require('fs');
const axios = require('axios');

exports.login = login
exports.enterCourse = enterCourse
exports.fetchFormation = fetchFormation
exports.fetchVideo = fetchVideo
exports.fetchCourse = fetchCourse
exports.downloadVideo = downloadVideo

function fetch(options) {
     return new Promise(resolve => request(options, (error, response, body) => resolve({error, response, body})))
 }

async function enterCourse(slug) {
	let res = await fetch({
		url: `https://cursos.alura.com.br/courses/${slug}/tryToEnroll`,
		method: 'GET',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'alura-mobi/android',
			'Host': 'cursos.alura.com.br',
			'Authorization': `Bearer ${accessToken}`,
			'Connection': 'Keep-Alive'
		}
	})
}

 async function login(mail, pass) {
    let res = await fetch({
        url: 'https://cursos.alura.com.br/mobile/token',
        method: 'POST',
        body: `password=${pass}&client_secret=3de44ac5f5bccbcfba14a77181fbdbb9&client_id=br.com.alura.mobi&username=${mail}&grant_type=password`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'alura-mobi/android',
            'Host': 'cursos.alura.com.br',
            'Connection': 'Keep-Alive'
        }
    })

    if (res.body.includes('access_token')){
        let token = JSON.parse(res.body).access_token;
        accessToken = token
        return true
    } 
    return false
}

 async function fetchVideo(id, slug) {
    let res = await fetch({
        url: `https://cursos.alura.com.br/mobile/courses/${slug}/busca-video-${id}`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'alura-mobi/android',
            'Host': 'cursos.alura.com.br',
            'Authorization': `Bearer ${accessToken}`,
            'Connection': 'Keep-Alive'
        }
    });

    let [hd, sd] = JSON.parse(res.body);
    return hd.link;
}

 async function fetchFormation(formation) {

	let res = await fetch({
		url: `https://www.alura.com.br/api/${formation}`,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'alura-mobi/android',
			'Host': 'cursos.alura.com.br',
			'Authorization': `Bearer ${accessToken}`,
			'Connection': 'Keep-Alive'
		}
	})

	return res.body

}

async function fetchCourse(course) {
    let res = await fetch({
        url: `https://cursos.alura.com.br/mobile/v2/course/${course}`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'alura-mobi/android',
            'Host': 'cursos.alura.com.br',
            'Authorization': `Bearer ${accessToken}`,
            'Connection': 'Keep-Alive'
        }
    })

    return res.body
}

async function downloadVideo(path, url) {
    console.log('baixando: ' + path)
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    })

    response.data.pipe(fs.createWriteStream(path))
    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            resolve()
        })

        response.data.on('error', () => {
            reject()
        })
    })
}