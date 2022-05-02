var accessToken = ""
const request = require('request');
const { url } = require('inspector');
const fs = require('fs');
const axios = require('axios');

exports.login = login
exports.enterCourse = enterCourse
exports.fetchFormation = fetchFormation
exports.fetchAllFormations = fetchAllFormations
exports.fetchVideo = fetchVideo
exports.fetchCourse = fetchCourse
exports.downloadVideo = downloadVideo

function fetch(options) {
     return new Promise(resolve => request(options, (error, response, body) => resolve({error, response, body})))
 }

async function enterCourse(slug) {
    console.log('Entrando no curso ' + slug)
	fetch({
		url: `https://cursos.alura.com.br/courses/${slug}/tryToEnroll`,
		method: 'GET',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'alura-mobi/android',
			'Host': 'cursos.alura.com.br',
			'Authorization': `Bearer ${accessToken}`,
			'Connection': 'Keep-Alive'
		}
	}).then(res => {
        if (res.error) {
            console.log('Erro ao entrar no curso ' + res.error)
        } else {
            console.log('Entrou no curso ' + slug)
        }
        return
    })
}

 async function login(mail, pass) {
     console.log('Fazendo login')
    fetch({
        url: 'https://cursos.alura.com.br/mobile/token',
        method: 'POST',
        body: `password=${pass}&client_secret=3de44ac5f5bccbcfba14a77181fbdbb9&client_id=br.com.alura.mobi&username=${mail}&grant_type=password`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'alura-mobi/android',
            'Host': 'cursos.alura.com.br',
            'Connection': 'Keep-Alive'
        }
    }).then(res => {
        console.log(res.body)
        if (res.error) {
            console.log('Erro ao logar ' + res.error)
        }
    
        if (res.body.includes('access_token')){
            let token = JSON.parse(res.body).access_token;
            accessToken = token
            console.log('Login feito!')
            return true
        } 
        return false
    })
}

 async function fetchVideo(id, slug) {
     console.log('Baixando informacoes sobre o video ' + id)
    fetch({
        url: `https://cursos.alura.com.br/mobile/courses/${slug}/busca-video-${id}`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'alura-mobi/android',
            'Host': 'cursos.alura.com.br',
            'Authorization': `Bearer ${accessToken}`,
            'Connection': 'Keep-Alive'
        }
    }).then(res => {
        if (res.error) {
            console.log('Erro ao baixar video ' + slug + ' ' + res.error)
        }
    
        try {
            let [hd, sd] = JSON.parse(res.body);
            return hd.link;
        } catch {
            throw res.error
        }
    })
}

async function fetchAllFormations() {
    console.log('Baixando informações sobre todas as formações, aguarde.....')
	fetch({
		url: `https://cursos.alura.com.br/api/formacoes`,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'alura-mobi/android',
			'Host': 'cursos.alura.com.br',
			'Authorization': `Bearer ${accessToken}`,
			'Connection': 'Keep-Alive'
		}
	}).then(res => {
        if (res.error) {
            console.log('Erro ao obter informacoes de formacoes ' + res.error)
        } else {
            console.log('Informaçoes sobre todas as formacoes baixadas')
        }
    
        return JSON.parse(res.body)
    })
}

 async function fetchFormation(formation) {
    console.log('Baixando informacoes sobre a formacao ' + formation)
	fetch({
		url: `https://www.alura.com.br/api/${formation}`,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'alura-mobi/android',
			'Host': 'cursos.alura.com.br',
			'Authorization': `Bearer ${accessToken}`,
			'Connection': 'Keep-Alive'
		}
	}).then(res => {
        if (res.error) {
            console.log('Erro ao baixar formacao ' + res.error)
        } else {
            console.log('Informacoes sobre a formacao baixada')
        }
    
        return res.body
    })
}

async function fetchCourse(course) {
    console.log('Baixando informacao sobre o curso ' + course)
    fetch({
        url: `https://cursos.alura.com.br/mobile/v2/course/${course}`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'alura-mobi/android',
            'Host': 'cursos.alura.com.br',
            'Authorization': `Bearer ${accessToken}`,
            'Connection': 'Keep-Alive'
        }
    }).then(res => {
        if (res.error) {
            console.log('Erro ao baixar informacoes do curso ' + res.error)
        } else {
            console.log('Informacoes do curso baixadas')
        }
    
        return res.body
    })
}

async function downloadVideo(path, url) {
    console.log(url)
    console.log('Baixando: ' + path)
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