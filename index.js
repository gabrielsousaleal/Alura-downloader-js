'use strict';

const request = require('request');
const fs = require('fs');
const axios = require('axios');

let jsonData = fs.readFileSync("./config.json", "utf8");
let data = JSON.parse(jsonData)
main();

/**
 * main function, where the magic happens
 * @param {string} account 
 * @param {string} course 
 */
 async function main() {

    let email = data['email'];
    let password = data['password'];
	let formation = data['formation']
    
    let access_token = await sign_in(email, password);

    if (!access_token) {
    	return;
    }

	let parse = await get_formation(access_token, formation);
	let formationJson = JSON.parse(parse);
	let steps = formationJson.steps;
	let formationTitle = tratarTitulo(formation)
	create_folder(formationTitle)
	let courses = []

	for (let i = 0; i < steps.length; i++) {
		let currentStep = steps[i]
		let stepCourses = currentStep.courses
		let currentStepTitle = tratarTitulo(currentStep.title)
		create_folder(`${formationTitle}/${currentStepTitle}`)
		for (let j = 0; j < stepCourses.length; j++) {
			let currentCourse = stepCourses[j]
            let courseSlug = currentCourse.slug
			let currentCourseTitle = tratarTitulo(currentCourse.title)
			create_folder(`${formationTitle}/${currentStepTitle}/${currentCourseTitle}`)
            let courseResponse = await get_course(access_token, courseSlug);
			let course = JSON.parse(courseResponse)
			let sections = course.sections
			for (let k = 0; k < sections.length; k++) {
				let videos = sections[k].videos
				for (let l = 0; l < videos.length; l++) {
					let currentVideo = videos[l]
					let currentVideoTitle = tratarTitulo(currentVideo.nome)
					let videoID = currentVideo.id
					let folderName = `${formationTitle}/${currentStepTitle}/${currentCourseTitle}/${currentVideoTitle}`
					let url = await get_video(videoID, courseSlug, access_token);
					video_download(`${folderName}.mp4`, url, currentVideoTitle)
				}
			}
		}
	}
}

function downloadVideo() {
   
}

function tratarTitulo(titulo) {
	var textoSemAcentos = titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
	var textoTratado = textoSemAcentos.replace(/[^\w\s]/gi, '');
	return textoTratado;
}

/**
 * Login in account
 * @param {string} mail 
 * @param {string} pass 
 */
 async function sign_in(mail, pass) {
 	let res = await http_request({
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

 	if (res.body.includes('access_token'))
 		return JSON.parse(res.body).access_token;

 	return false

 }

/**
 * get link video for download
 * @param {int} id 
 * @param {string} slug 
 * @param {string} token 
 */
 async function get_video(id, slug, token) {
 	let res = await http_request({
 		url: `https://cursos.alura.com.br/mobile/courses/${slug}/busca-video-${id}`,
 		headers: {
 			'Content-Type': 'application/x-www-form-urlencoded',
 			'User-Agent': 'alura-mobi/android',
 			'Host': 'cursos.alura.com.br',
 			'Authorization': `Bearer ${token}`,
 			'Connection': 'Keep-Alive'
 		}
 	});

 	let [hd, sd] = JSON.parse(res.body);
 	return hd.link;

 }

 /**
 * get formation: video list and informations 
 * @param {sting} access_token 
 * @param {string} formation 
 */
  async function get_formation(access_token, formation) {

	let res = await http_request({
		url: `https://www.alura.com.br/api/${formation}`,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'alura-mobi/android',
			'Host': 'cursos.alura.com.br',
			'Authorization': `Bearer ${access_token}`,
			'Connection': 'Keep-Alive'
		}
	})

	return res.body

}

/**
 * get course: video list and informations 
 * @param {sting} access_token 
 * @param {string} course 
 */
 async function get_course(access_token, course) {

 	let res = await http_request({
 		url: `https://cursos.alura.com.br/mobile/v2/course/${course}`,
 		headers: {
 			'Content-Type': 'application/x-www-form-urlencoded',
 			'User-Agent': 'alura-mobi/android',
 			'Host': 'cursos.alura.com.br',
 			'Authorization': `Bearer ${access_token}`,
 			'Connection': 'Keep-Alive'
 		}
 	})

 	return res.body

 }

/**
 * video downloand and save in path
 * @param {string} path 
 * @param {string} url 
 */
 async function video_download(path, url, title) {
	console.log(path)
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

/**
 * send http request with proxy
 * @param {object} options 
 */
 function http_request(options) {
 	return new Promise(resolve => request(options, (error, response, body) => resolve({error, response, body})))
 }

/**
 * create folder
 * @param {string} dir 
 */
 function create_folder(dir) {
 	if (!fs.existsSync(__dirname + '/' + dir)) {
 		fs.mkdirSync(__dirname + '/' + dir);
 	}
 }

