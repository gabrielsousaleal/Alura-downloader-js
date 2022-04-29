'use strict';
const fs = require('fs');

let jsonData = fs.readFileSync("./config.json", "utf8");
let data = JSON.parse(jsonData)
let services = require('./modules/services.js')
main();

 async function main() {
    let email = data['email'];
    let password = data['password'];
	let formationList = data['formations']
    
	let logged = await services.login(email, password);
	if (!logged) { return }

	let formationNames = getFormationsNames(formationList)

	formationNames.forEach( async formationName => {
		console.log(formationName)
		let formation = await fetchFormation(formationName)
		formation.steps.forEach( async (step, index) => {
			await getCoursesFromStep(step, formation.title, index)
		})
	})
}

function getFormationsNames(formationList) {
	var names = []
	formationList.forEach( formation => {
		let splited = formation.split('/')
		let name = splited[splited.length - 1]
		console.log(name)
		names.push(name)
	});
	return names
}

async function fetchFormation(formationName) {
	let parse = await services.fetchFormation(formationName);
	let formation = JSON.parse(parse);
	return formation
}

async function getCoursesFromStep(step, formation, stepIndex) {
	step.courses.forEach( async (course, coursesIndex) => {
		let slug = course.slug
		services.enterCourse(slug)
		let completeCourse = await getCompleteCourse(slug)
		completeCourse.sections.forEach( async (section, index) => {
			let folder = `${formation}/${stepIndex + 1} ${step.title}/${coursesIndex + 1} ${course.title}/ ${index + 1} - ${section.titulo}`
			downloadVideosFromSection(section, slug, folder)
		})
	})
}

async function getCompleteCourse(slug) {
	let completeCourse = await services.fetchCourse(slug)
	return JSON.parse(completeCourse)
}

 async function downloadVideosFromSection(section, courseSlug, folder) {
	let videos = section.videos
	console.log(videos.length)
	videos.forEach(async (video, index) => { 
		let currentVideoTitle = removeSpecialCharacters(video.nome)
		let videoID = video.id
		let createdFolder = createFolder(folder)
		let videoPath = `${createdFolder}/${index + 1} ${currentVideoTitle}.mp4`
		let url = await services.fetchVideo(videoID, courseSlug)
		services.downloadVideo(videoPath, url)
	});
}

function removeSpecialCharacters(string) {
	var withoutAccent = string.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
	var withoutSpecialCharacters = withoutAccent.replace(/[^\w\s]/gi, '');
	return withoutSpecialCharacters;
}

 function createFolder(dir) {
	 let folders = dir.split('/')
	 var currentFolder = "Downloads/"
	 folders.forEach( folder => {
		let folderTratado = removeSpecialCharacters(folder)
		currentFolder += `${folderTratado}/`
		if (!fs.existsSync(__dirname + '/' + currentFolder)) {
			fs.mkdirSync(__dirname + '/' + currentFolder);	
		}
	 })
	 return currentFolder
 }