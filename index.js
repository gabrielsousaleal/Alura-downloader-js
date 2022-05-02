'use strict';
const fs = require('fs');

let jsonData = fs.readFileSync("./config.json", "utf8");
let data = JSON.parse(jsonData)
let services = require('./modules/services.js')
var errorVideoList = []
var errorFormationList = []
main();

 async function main() {
    let email = data['email'];
    let password = data['password'];
	let formationList = data['formations']
	let downloadAllFormations = data['downloadAllFormations']

	services.login(email, password).then(logged => {
		if (!logged) { 
			console.log('Falha no Login')
			return 
		}
	
		if (downloadAllFormations) {
			downloadFromAllFormations()
		} else {
			downloadFromFormationList(formationList)
		}
	}) 

	// console.log('FORMACOES QUE DERAM ERRO: ' + errorFormationList)
	// console.log('VIDEOS QUE DEAM ERRO: ' + errorVideoList)
}

async function downloadFromFormationList(formationList) {
	let formationNames = getFormationsNames(formationList)

	formationNames.forEach( async formationName => {
		try {
			fetchFormation(formationName)
			let formationCategory = formation.categoryName
			formation.steps.forEach( async (step, index) => {
				getCoursesFromStep(step, formation.title, index, formationCategory)
			})
		} catch {
			errorFormationList.push(formationName)
		}
	})
}

async function downloadFromAllFormations() {
	services.fetchAllFormations().then(formations => {
		formations.forEach( async formation => {
			try {
				let formationCategory = formation.categoryName
				var name = 'formacao-' + formation.code
				fetchFormation(name).then(completeFormation => {
					completeFormation.steps.forEach( async (step, index) => {
						getCoursesFromStep(step, formation.title, index, formationCategory)
					})
				})
			} catch {
				errorFormationList.push(formationName)
			}
		})
	})
}

function getFormationsNames(formationList) {
	var names = []
	formationList.forEach( formation => {
		let splited = formation.split('/')
		let name = splited[splited.length - 1]
		names.push(name)
	});
	return names
}

async function fetchFormation(formationName) {
	services.fetchFormation(formationName).then(parse => {
		try {
			let formation = JSON.parse(parse);
			return formation
		} catch {
			console.log('Erro ao baixar formação ' + formationName)
			throw 'erro'
		}
	})
}

async function getCoursesFromStep(step, formation, stepIndex, formationCategory) {
	step.courses.forEach( async (course, coursesIndex) => {
		let slug = course.slug
		services.enterCourse(slug)
		getCompleteCourse(slug).then(completeCourse => {
			completeCourse.sections.forEach( async (section, index) => {
				let folder = `${formationCategory}/${formation}/${stepIndex + 1} ${step.title}/${coursesIndex + 1} ${course.title}/ ${index + 1} - ${section.titulo}`
				downloadVideosFromSection(section, slug, folder)
			})
		})
	})
}

async function getCompleteCourse(slug) {
	services.fetchCourse(slug).then(completeCourse => {
		return JSON.parse(completeCourse)
	})
}

 async function downloadVideosFromSection(section, courseSlug, folder) {
	let videos = section.videos
	videos.forEach(async (video, index) => { 
		let currentVideoTitle = removeSpecialCharacters(video.nome)
		let videoID = video.id
		let createdFolder = createFolder(folder)
		let videoPath = `${createdFolder}/${index + 1} ${currentVideoTitle}.mp4`
		try {
			services.fetchVideo(videoID, courseSlug).then(url => {
				services.downloadVideo(videoPath, url)
			})
		} catch {
			errorVideoList.push(formationName)
		}
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

 String.prototype.insert = function(index, string) {
	if (index > 0) {
	  return this.substring(0, index) + string + this.substr(index);
	}
  
	return string + this;
  };