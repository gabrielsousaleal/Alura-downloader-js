'use strict';

const request = require('request');
const fs = require('fs');
const axios = require('axios');
const { url } = require('inspector');

let jsonData = fs.readFileSync("./config.json", "utf8");
let data = JSON.parse(jsonData)
var access_token = ""
main();

/**
 * main function, where the magic happens
 * @param {string} account 
 * @param {string} course 
 */
 async function main() {

    let email = data['email'];
    let password = data['password'];
	let formationName = data['formation']
    
	 access_token = await sign_in(email, password);

    if (!access_token) {
    	return;
    }

	let formation = await fetchFormation(formationName)

	formation.steps.forEach( async step => {
		await getCoursesFromStep(step, formation.title)
	})
}

async function fetchFormation(formationName) {
	let parse = await get_formation(formationName);
	let formation = JSON.parse(parse);
	return formation
}

async function getCoursesFromStep(step, formation) {
	step.courses.forEach( async course => {
		let slug = course.slug
		enterCourse(slug)
		let completeCourse = await getCompleteCourse(slug)
		let folder = `${formation}/${step.title}/${course.title}`
		completeCourse.sections.forEach( section => {
			downloadVideosFromSection(section, slug, folder)
		})
	})
}

async function getCompleteCourse(slug) {
	let completeCourse = await get_course(slug)
	return JSON.parse(completeCourse)
}

 async function downloadVideosFromSection(section, courseSlug, folder) {
	let videos = section.videos
	videos.forEach(async video => { 
		let currentVideoTitle = tratarTitulo(video.nome)
		let videoID = video.id
		let createdFolder = create_folder(folder)
		let videoPath = `${createdFolder}/${currentVideoTitle}.mp4`
		let url = await get_video(videoID, courseSlug, access_token)
		video_download(videoPath, url)
	});
}

function tratarTitulo(titulo) {
	var textoSemAcentos = titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
	var textoTratado = textoSemAcentos.replace(/[^\w\s]/gi, '');
	return textoTratado;
}

/**
 * get link video for download
 * @param {string} slug 
 */
async function enterCourse(slug) {
	let res = await http_request({
		url: `https://cursos.alura.com.br/courses/${slug}/tryToEnroll`,
		method: 'GET',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'alura-mobi/android',
			'Host': 'cursos.alura.com.br',
			'Authorization': `Bearer ${access_token}`,
			'Connection': 'Keep-Alive'
		}
	})
}

/**
 * get link video for download
 * @param {string} slug 
 * @param {string} token 
 */
 async function stopCourse(slug, token) {
	let res = await http_request({
		url: `https://cursos.alura.com.br/courses/stop`,
		method: 'POST',
		body: `registrationId=8497089`,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'alura-mobi/android',
			'Host': 'cursos.alura.com.br',
			'Authorization': `Bearer ${token}`,
			'Connection': 'Keep-Alive'
		}
	})
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
  async function get_formation(formation) {

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
 async function get_course(course) {
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
 async function video_download(path, url) {
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
	 let folders = dir.split('/')
	 var currentFolder = ""
	 folders.forEach( folder => {
		let folderTratado = tratarTitulo(folder)
		currentFolder += `${folderTratado}/`
		if (!fs.existsSync(__dirname + '/' + currentFolder)) {
			fs.mkdirSync(__dirname + '/' + currentFolder);	
		}
	 })
	 return currentFolder
 }

