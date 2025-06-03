// imports ->
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import GUI from 'lil-gui'
import vert from '../shaders/vert.glsl?raw'
import frag from '../shaders/frag.glsl?raw'
import fragLine from '../shaders/fragLine.glsl?raw'
import { settings } from './gui'
import matcapImg from '/matcap.png?url'

// constants ->
const device = {
	width: window.innerWidth,
	height: window.innerHeight,
	pixelRatio: window.devicePixelRatio,
}

export class Sketch {
	canvas: HTMLCanvasElement
	scene: THREE.Scene
	camera: THREE.PerspectiveCamera
	renderer: THREE.WebGLRenderer
	clock: THREE.Clock
	controls: OrbitControls
	textureLoader: THREE.TextureLoader
	gui: GUI
	time: number
	playhead: number
	mesh?: THREE.Mesh
	meshLines?: THREE.LineSegments
	meshPoints?: THREE.Points
	meshSphere?: THREE.Mesh
	material?: THREE.ShaderMaterial
	geometry?: THREE.BufferGeometry
	stats?: Stats
	ambientLight?: THREE.AmbientLight
	directionalLight?: THREE.DirectionalLight

	constructor(canvas: HTMLCanvasElement) {
		this.time = 0
		this.playhead = 0

		this.canvas = canvas
		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(
			35,
			device.width / device.height,
			0.01,
			1000
		)
		this.camera.position.set(0, 0, 6)
		this.scene.add(this.camera)

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
		})
		this.renderer.setSize(device.width, device.height)
		this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2))
		this.renderer.setClearColor(0x000000, 1)
		this.renderer.shadowMap.enabled = true
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

		this.controls = new OrbitControls(this.camera, canvas)
		this.textureLoader = new THREE.TextureLoader()
		this.gui = new GUI({
			width: 340,
			title: 'Settings',
		})
		this.clock = new THREE.Clock()

		this.initStats()
		this.init()
	}

	addGeometry(): void {
		this.geometry = new THREE.IcosahedronGeometry(1, 8)
		const edgeGeo = new THREE.EdgesGeometry(this.geometry)

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				resolution: { value: new THREE.Vector4() },
				playhead: { value: this.playhead }
			},
			vertexShader: vert,
			fragmentShader: frag,
			side: THREE.DoubleSide
		})
		this.mesh = new THREE.Mesh(this.geometry, this.material)

		this.meshLines = new THREE.LineSegments(
			edgeGeo,
			new THREE.ShaderMaterial({
				uniforms: {
					time: { value: 0 },
					resolution: { value: new THREE.Vector4() },
					playhead: { value: 0 }
				},
				vertexShader: vert,
				fragmentShader: fragLine,
				side: THREE.DoubleSide
			})
		)
		this.meshLines.scale.set(1.05, 1.05, 1.05)

		this.meshPoints = new THREE.Points(
			this.geometry,
			new THREE.ShaderMaterial({
				uniforms: {
					time: { value: 0 },
					resolution: { value: new THREE.Vector4() },
					playhead: { value: 0 }
				},
				vertexShader: vert,
				fragmentShader: fragLine,
				side: THREE.DoubleSide
			})
		)
		this.meshPoints.scale.set(
			1.1,
			1.1,
			1.1
		)

		this.meshSphere = new THREE.Mesh(this.geometry, new THREE.MeshMatcapMaterial({
			matcap: this.textureLoader.load(matcapImg),
			opacity: 1,
			transparent: true
		}))
		this.meshSphere.scale.set(
			1.4,
			1.4,
			1.4
		)

		this.scene.add(this.mesh)
		this.scene.add(this.meshLines)
		this.scene.add(this.meshPoints)
		this.scene.add(this.meshSphere)

		this.addLights()
		this.addHelpers()
	}

	render(): void {
		this.stats?.begin()
		this.time += 0.005
		this.playhead += 0.005;

		(this.mesh!.material as THREE.ShaderMaterial).uniforms.playhead.value = this.playhead;
		(this.meshLines!.material as THREE.ShaderMaterial).uniforms.playhead.value = this.playhead;
		(this.meshPoints!.material as THREE.ShaderMaterial).uniforms.playhead.value = this.playhead;

		this.scene.rotation.x = 0.5 * Math.sin(Math.PI * 4 * this.playhead)
		this.scene.rotation.y = 0.5 * Math.sin(Math.PI * 2 * this.playhead)
		this.scene.rotation.z = 0.5 * Math.sin(Math.PI * 2 * this.playhead)

		this.controls.update()
		this.renderer.render(this.scene, this.camera)
		this.stats?.end()
		requestAnimationFrame(this.render.bind(this))
	}

	init(): void {
		this.addGeometry()
		this.resize()
		this.render()
	}

	initStats(): void {
		this.stats = new Stats()
		this.stats.showPanel(0)
		this.stats.addPanel(new Stats.Panel('MB', '#f8f', '#212'))
		this.stats.dom.style.cssText = 'position:absolute;top:0;left:0;'
		document.body.appendChild(this.stats.dom)
	}

	addLights(): void {
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 2)
		this.directionalLight.target = this.mesh!
		this.directionalLight.position.set(5, 5, 5)
		this.directionalLight.castShadow = true
		this.directionalLight.shadow.mapSize.width = 1024
		this.directionalLight.shadow.mapSize.height = 1024

		this.scene.add(this.directionalLight)

		this.ambientLight = new THREE.AmbientLight(
			new THREE.Color(1, 1, 1),
			0.5
		)
		this.scene.add(this.ambientLight)
	}

	resize(): void {
		window.addEventListener('resize', this.onResize.bind(this))
	}

	onResize(): void {
		device.width = window.innerWidth
		device.height = window.innerHeight

		this.camera.aspect = device.width / device.height
		this.camera.updateProjectionMatrix()

		this.renderer.setSize(device.width, device.height)
	}

	addHelpers(): void {
		const geometrySettings = this.gui.addFolder('Geometry settings').close()
		const ambientLightSettings = this.gui.addFolder('Light settings').close()

		const eventsSettings = this.gui.addFolder('Trigger events')

		geometrySettings.add(this.mesh!.position, 'y')
			.name('y position')
			.min(-2)
			.max(2)
			.step(0.01)

		geometrySettings.add(this.mesh!, 'visible').name('visibility')
		geometrySettings.add(this.meshLines!, 'visible').name('visibility meshLines')

		geometrySettings.add(settings, 'meshLinesScaleFactor')
			.name('meshLines scale')
			.min(1)
			.max(2)
			.step(0.01).onChange((val: number) => {
			this.meshLines!.scale.set(val, val, val)
		})
		geometrySettings.add(settings, 'meshPointsScaleFactor')
			.name('meshPoints scale')
			.min(1)
			.max(3)
			.step(0.01).onChange((val: number) => {
			this.meshPoints!.scale.set(val, val, val)
		})

		settings.spin = () => {
			gsap.to(this.mesh!.rotation, {
				duration: 1,
				y: this.mesh!.rotation.y + Math.PI * 2,
			})
		}

		eventsSettings.add(settings, 'spin').name('spin')

		ambientLightSettings
			.addColor(settings, 'ambientLightColor')
			.name('ambient light color')
			.onChange(() => {
				this.ambientLight!.color.set(settings.ambientLightColor)
			})

		ambientLightSettings
			.add(this.ambientLight!, 'intensity')
			.name('ambient light intensity')
			.min(0)
			.max(10)
			.step(0.1)
	}
}
