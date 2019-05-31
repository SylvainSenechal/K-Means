'use strict';

let imgLoader = document.getElementById("imgInput")
let ctx, canvas, offsetCanvas
let scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, renderer, container

let tensorImg = []
let nbCluster = 7 // TODO: Chercher le meilleur k dans l'algo
let middleCluster = []
let clusters = Array(nbCluster).fill().map( () => [])

const initkMeans = () => {
  for (let i = 0; i < nbCluster; i++) {
    let index = Math.floor(Math.random()*(tensorImg.length/3))*3 // premier centres randoms mais sur un point
    let x = tensorImg[index]
    let y = tensorImg[index+1]
    let z = tensorImg[index+2]
    let geometry = new THREE.BoxGeometry(10, 10, 10)
    let material = new THREE.MeshBasicMaterial( {color: 0x00ff00} )
    let cube = new THREE.Mesh(geometry, material)
    cube.position.set(x, y, z)
    scene.add(cube)
    middleCluster[i] = {x: x, y: y, z: z, mesh: cube}
  }

  for (let i = 0; i < tensorImg.length; i+=3) { // Assignation des points
    let clusterIndex = 0
    let minDst = 10000
    for (let j = 0; j < nbCluster; j++) {
      let dst = Math.abs(tensorImg[i] - middleCluster[j].x) + Math.abs(tensorImg[i+1] - middleCluster[j].y) + Math.abs(tensorImg[i+2] - middleCluster[j].z)
      if (dst < minDst) {
        minDst = dst
        clusterIndex = j
      }
    }
    clusters[clusterIndex].push(tensorImg[i], tensorImg[i+1], tensorImg[i+2])
  }
}

const kMeanIteration = () => {
  // calcul middleCluster :
  for (let i = 0; i < nbCluster; i++) {
    let x = 0
    let y = 0
    let z = 0
    for (let j = 0; j < clusters[i].length; j+=3) {
      x += clusters[i][j]
      y += clusters[i][j+1]
      z += clusters[i][j+2]
    }
    middleCluster[i].mesh.position.set(x/(clusters[i].length/3), y/(clusters[i].length/3), z/(clusters[i].length/3))
    middleCluster[i] = {x: x/(clusters[i].length/3), y: y/(clusters[i].length/3), z: z/(clusters[i].length/3), mesh: middleCluster[i].mesh}
  }

  // Assignation points
  clusters = Array(nbCluster).fill().map( () => [])
  for (let i = 0; i < tensorImg.length; i+=3) {
    let clusterIndex = 0
    let minDst = 10000
    for (let j = 0; j < nbCluster; j++) {
      let dst = Math.abs(tensorImg[i] - middleCluster[j].x) + Math.abs(tensorImg[i+1] - middleCluster[j].y) + Math.abs(tensorImg[i+2] - middleCluster[j].z)
      if (dst < minDst) {
        minDst = dst
        clusterIndex = j
      }
    }
    clusters[clusterIndex].push(tensorImg[i], tensorImg[i+1], tensorImg[i+2])
  }
  dstTotal()
}

const dstTotal = () => {
  let dst = 0
  for (let i = 0; i < nbCluster; i++) {
    for (let j = 0; j < clusters[i].length; j+=3) {
      dst += Math.abs(clusters[i][j] - middleCluster[i].x) + Math.abs(clusters[i][j+1] - middleCluster[i].y) + Math.abs(clusters[i][j+2] - middleCluster[i].z)
    }
  }
  console.log("Distance kmeans : ", dst)
}

const init = () => {
  canvas = document.getElementById('canvasImg')
  ctx = canvas.getContext('2d')
  createScene()
  createLights()
  createAxis()

  loop()
}

const loop = () => {
  move()

  renderer.render(scene, camera)
  requestAnimationFrame(loop)
}

const uploadImage = e => {
  let reader = new FileReader()
  reader.onload = event => {
    let img = new Image()
    img.onload = () => {
      ctx.canvas.width = img.width
      ctx.canvas.height = img.height
      ctx.drawImage(img, 0, 0, 300, 300)

      offsetCanvas = document.createElement('canvas')
      offsetCanvas.width = img.width
      offsetCanvas.height = img.height
      offsetCanvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height)
      getTensorFromImg()
      drawTensor()
    }
    img.src = event.target.result
  }
  reader.readAsDataURL(e.target.files[0])
}

const createScene = () => {
	scene = new THREE.Scene()
  let width = window.innerWidth
  let height = window.innerHeight

  aspectRatio = width / height
	fieldOfView = 60
	nearPlane = 1
	farPlane = 40000

	camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
  camera.position.set(70, 125, 400)

	renderer = new THREE.WebGLRenderer({ // voir tous les arguments existants
		alpha: true,
		antialias: true,
		shadowMap: THREE.PCFSoftShadowMap
	})
	renderer.setSize(width, height)

	container = document.getElementById('canvas3D')
	container.appendChild(renderer.domElement)
	// window.addEventListener('resize', resize, false)
}

const createLights = () => {
	let hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9) // VOIR .9 ET 0.9 ?
	scene.add(hemisphereLight)
}

const createAxis = () => {
  let geometryRed = new THREE.Geometry()
  let materialRed = new THREE.LineBasicMaterial({color: 0xff0000})
  geometryRed.vertices.push(new THREE.Vector3(0, 0, 0))
  geometryRed.vertices.push(new THREE.Vector3(255, 0, 0))
  let redLine = new THREE.Line(geometryRed, materialRed)

  let geometryGreen = new THREE.Geometry()
  let materialGreen = new THREE.LineBasicMaterial({color: 0x00ff00})
  geometryGreen.vertices.push(new THREE.Vector3(0, 0, 0))
  geometryGreen.vertices.push(new THREE.Vector3(0, 255, 0))
  let greenLine = new THREE.Line(geometryGreen, materialGreen)

  let geometryBlue = new THREE.Geometry()
  let materialBlue = new THREE.LineBasicMaterial({color: 0x0000ff})
  geometryBlue.vertices.push(new THREE.Vector3(0, 0, 0))
  geometryBlue.vertices.push(new THREE.Vector3(0, 0, 255))
  let blueLine = new THREE.Line(geometryBlue, materialBlue)

  var geometry = new THREE.BoxGeometry(258, 258, 258)
  var material = new THREE.MeshBasicMaterial({color: 0x000000, opacity: 0.3, wireframe: true})
  var cube = new THREE.Mesh(geometry, material)
  cube.position.set(254/2, 254/2, 254/2)
  scene.add(cube)
  scene.add(redLine, greenLine, blueLine)
}

const drawTensor = () => {
  console.log("startDraw")

  let geometry = new THREE.BufferGeometry()
  let positions = new Uint8Array(tensorImg)
  let colors = []//new Uint8Array(tensorImg)
  for (let i = 0; i < tensorImg.length; i+=3) {
    // positions.push(tensorImg[i], tensorImg[i+1], tensorImg[i+2])
    colors.push(tensorImg[i]/255, tensorImg[i+1]/255, tensorImg[i+2]/255)
  }
  geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  let material = new THREE.PointsMaterial({size: 1, vertexColors: THREE.VertexColors})
  let points = new THREE.Points(geometry, material)
  scene.add(points)
  camera.lookAt(0, 0, 0)

  initkMeans()
}


const getTensorFromImg = () => {
  // tensorImg = Array(offsetCanvas.width).fill(3).map( (_, id1) => Array(offsetCanvas.height).fill().map( (_, id2) => offsetCanvas.getContext('2d').getImageData(id1, id2, 1, 1).data.slice(0, 3)))
  let img = offsetCanvas.getContext('2d').getImageData(0, 0, offsetCanvas.width, offsetCanvas.height).data
  console.log(img.length)
  for (let i = 0; i < img.length; i+=4) {
    tensorImg.push(img[i], img[i+1], img[i+2])
  }
  tensorImg = new Uint8Array(tensorImg)
}

///////////////////////////
// Movement functions /////
///////////////////////////
let mouse = new THREE.Vector2()
let haut, bas, droite, gauche
let vitesseX = 0
let vitesseY = 0
const move = () => {
	if (haut 	== true && vitesseY > -5)	 { vitesseY-=1.8 }
	if (droite 	== true && vitesseX < +5) { vitesseX+=1.8 }
	if (bas 		== true && vitesseY < +5) { vitesseY+=1.8 }
	if (gauche 	== true && vitesseX > -5) { vitesseX-=1.8 }

	if (-0.5 < vitesseX && vitesseX < 0.5) { vitesseX = 0 }
	else {
		if(vitesseX > 0)		  { vitesseX -= 0.5 }
		else if(vitesseX < 0) { vitesseX += 0.5 }
	}

	if(-0.5 < vitesseY && vitesseY < 0.5)	{ vitesseY = 0 }
	else {
		if (vitesseY > 0)		   { vitesseY -= 0.5 }
		else if (vitesseY < 0) { vitesseY += 0.5 }
	}

	var VectResGetWDir = new THREE.Vector3()
	var composanteX = -(vitesseY * camera.getWorldDirection(VectResGetWDir).x)   + vitesseX * (-camera.getWorldDirection(VectResGetWDir).z)
	var composanteY =   vitesseY * (-camera.getWorldDirection(VectResGetWDir).z) + vitesseX * camera.getWorldDirection(VectResGetWDir).x

	camera.position.x += composanteX // gauche droite   vitesseX
	camera.position.z += composanteY // devant derrière vitesseY 	// A noter : ici composante Y actionne l'axe Z
	camera.position.y += -vitesseY*camera.getWorldDirection(VectResGetWDir).y
}

document.onkeydown = e => {
  kMeanIteration()

	if(e.keyCode == 90) { haut 	= 	true }
	if(e.keyCode == 68) { droite = 	true }
	if(e.keyCode == 83) { bas 	  = 	true }
	if(e.keyCode == 81) { gauche = 	true }
}
document.onkeyup = e => {
	if(e.keyCode == 90) { haut 	= 	false }
	if(e.keyCode == 68) { droite = 	false }
	if(e.keyCode == 83) { bas 	  = 	false }
	if(e.keyCode == 81) { gauche = 	false }
}

document.onclick = e => {
  let elem = document.getElementById("canvas3D")
  elem.requestPointerLock = elem.requestPointerLock    ||
                            elem.mozRequestPointerLock
  elem.requestPointerLock()
}
document.onmousemove = e => {
	mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1
	mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1

	camera.rotation.order = 'YXZ' // default is 'XYZ'
	camera.rotateX(-e.movementY*0.1*Math.PI/180)
	camera.rotateY(-e.movementX*0.1*Math.PI/180)
	camera.rotation.z = 0
}



imgLoader.addEventListener("change", uploadImage, false)
window.addEventListener('load', init)
