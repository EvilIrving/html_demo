import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class BaseboardHeater {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.setupScene();
    }

    setupScene() {
        // 渲染器设置
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // 场景背景
        this.scene.background = new THREE.Color(0xf0f0f0);

        // 灯光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(ambientLight, directionalLight);

        // 相机位置
        this.camera.position.set(0, 2, 5);

        // 轨道控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.createHeaterModel();
        this.animate();
    }

    createHeaterModel() {
        const geometry = new THREE.BoxGeometry(4, 0.5, 0.3);
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0xd3d3d3,
            metalness: 0.8,
            roughness: 0.3
        });

        // 主体
        const heaterBody = new THREE.Mesh(geometry, metalMaterial);
        this.scene.add(heaterBody);

        // 散热网格
        const gridGeometry = new THREE.PlaneGeometry(3.8, 0.2);
        const gridMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < 5; i++) {
            const grid = new THREE.Mesh(gridGeometry, gridMaterial);
            grid.rotation.x = Math.PI / 2;
            grid.position.set(0, 0.15, -0.1 + i * 0.1);
            this.scene.add(grid);
        }

        // 温度效果
        this.temperatureEffect(heaterBody);
    }

    temperatureEffect(heaterBody) {
        const heatMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                heatIntensity: { value: 0.5 }
            },
            vertexShader: `
                varying vec2 vUv;
                uniform float time;
                void main() {
                    vUv = uv;
                    vec3 transformed = position + normal * sin(time + position.x) * 0.05;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float heatIntensity;
                varying vec2 vUv;
                void main() {
                    vec3 heatColor = mix(vec3(1.0, 0.6, 0.0), vec3(1.0, 0.2, 0.0), vUv.y);
                    float heat = sin(time * 2.0 + vUv.x * 10.0) * 0.5 + 0.5;
                    gl_FragColor = vec4(heatColor * heat * heatIntensity, 0.5);
                }
            `,
            transparent: true
        });

        const heatPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 0.5),
            heatMaterial
        );
        heatPlane.position.set(0, 0.3, 0.2);
        this.scene.add(heatPlane);

        this.heatMaterial = heatMaterial;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // 更新热效果
        if (this.heatMaterial) {
            this.heatMaterial.uniforms.time.value = performance.now() * 0.001;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    setHeatIntensity(intensity) {
        if (this.heatMaterial) {
            this.heatMaterial.uniforms.heatIntensity.value = intensity;
        }
    }
}

// 使用示例
const heater = new BaseboardHeater('heater-container');
// 可以通过 heater.setHeatIntensity(0.7) 调节热强度
