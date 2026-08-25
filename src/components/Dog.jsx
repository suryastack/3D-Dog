import * as THREE from "three";
import {
  useGLTF,
  useTexture,
  useAnimations,
} from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const Dog = () => {
  gsap.registerPlugin(useGSAP);
  gsap.registerPlugin(ScrollTrigger);

  const mouseGroup = useRef();
  const targetRotation = useRef({ x: 0, y: 0 });   

  const model = useGLTF("/models/dog.drc.glb");

  useThree(({ camera, scene, gl }) => {
    camera.position.z = 0.48;
    gl.toneMapping = THREE.ReinhardToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  });

  const { actions } = useAnimations(model.animations, model.scene);

  useEffect(() => {
    actions["Take 001"].play();
  }, [actions]);

  const [normalMap, specularMap, branchMap, branchNormalMap] = useTexture([
    "/dog_normals.jpg",
    "/dog_specular.jpg",
    "/branches_diffuse.jpg",
    "/branches_normals.jpg",
  ]).map((texture) => {
    texture.flipY = false;
    return texture;
  });

  normalMap.colorSpace = THREE.NoColorSpace;
  specularMap.colorSpace = THREE.NoColorSpace;

  branchMap.colorSpace = THREE.SRGBColorSpace;
  branchNormalMap.colorSpace = THREE.NoColorSpace;

  const [
    mat1,
    mat2,
    mat3,
    mat4,
    mat5,
    mat6,
    mat7,
    mat8,
    mat9,
    mat10,
    mat11,
    mat12,
    mat13,
    mat14,
    mat15,
    mat16,
    mat17,
    mat18,
    mat19,
    mat20,
  ] = useTexture([
    "./matcap/mat-1.png",
    "./matcap/mat-2.png",
    "./matcap/mat-3.png",
    "./matcap/mat-4.png",
    "./matcap/mat-5.png",
    "./matcap/mat-6.png",
    "./matcap/mat-7.png",
    "./matcap/mat-8.png",
    "./matcap/mat-9.png",
    "./matcap/mat-10.png",
    "./matcap/mat-11.png",
    "./matcap/mat-12.png",
    "./matcap/mat-13.png",
    "./matcap/mat-14.png",
    "./matcap/mat-15.png",
    "./matcap/mat-16.png",
    "./matcap/mat-17.png",
    "./matcap/mat-18.png",
    "./matcap/mat-19.png",
    "./matcap/mat-20.png",
  ]).map((texture) => {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });

  const material = useRef({
    uMatcap1: { value: mat2 },
    uMatcap2: { value: mat2 },
    uProgress: { value: 1.0 },
    uEyeTint: { value: 1.0 },
  });

  const branchTheme = useRef({
    uMatcap1: { value: mat2 },
    uMatcap2: { value: mat2 },
    uProgress: { value: 1.0 },
  });

  const dogMaterial = new THREE.MeshMatcapMaterial({
    normalMap: normalMap,
    matcap: mat2,
  });

  const branchMaterial = new THREE.MeshMatcapMaterial({
    normalMap: branchNormalMap,
    matcap: mat2,
  });

  const eyeMaterial = new THREE.MeshMatcapMaterial({
    matcap: mat2,
  });

  const dogModel = useRef(model);

  function onBeforeCompile(shader) {
    shader.uniforms.uMatcapTexture1 = material.current.uMatcap1;
    shader.uniforms.uMatcapTexture2 = material.current.uMatcap2;
    shader.uniforms.uProgress = material.current.uProgress;

    shader.uniforms.uSpecularMap = {
      value: specularMap,
    };

    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      `
      varying vec2 vDogUv;
  
      void main() {
        vDogUv = uv;
      `,
    );

    // Store reference to shader uniforms for GSAP animation

    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `
    uniform sampler2D uMatcapTexture1;
    uniform sampler2D uMatcapTexture2;
    uniform sampler2D uSpecularMap;
    uniform float uProgress;

    varying vec2 vDogUv;

    void main() {
    `,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 matcapColor = texture2D( matcap, uv );",
      `
      vec4 matcapColor1 = texture2D( uMatcapTexture1, uv );
      vec4 matcapColor2 = texture2D( uMatcapTexture2, uv );
      float transitionFactor  = 0.2;
      
      float progress = smoothstep(uProgress - transitionFactor,uProgress, (vViewPosition.x+vViewPosition.y)*0.5 + 0.5);

      vec4 matcapColor = mix(matcapColor2, matcapColor1, progress );

      float furDetail = texture2D(
        uSpecularMap,
        vDogUv
      ).r;

    matcapColor.rgb *= 1.0 + furDetail * 0.8;
    `,
    );
  }

  function branchOnBeforeCompile(shader) {
    shader.uniforms.uMatcapTexture1 = branchTheme.current.uMatcap1;
    shader.uniforms.uMatcapTexture2 = branchTheme.current.uMatcap2;
    shader.uniforms.uProgress = branchTheme.current.uProgress;

    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `
    uniform sampler2D uMatcapTexture1;
    uniform sampler2D uMatcapTexture2;
    uniform float uProgress;

    void main() {
    `,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 matcapColor = texture2D( matcap, uv );",
      `
    vec4 matcapColor1 = texture2D(uMatcapTexture1, uv);
    vec4 matcapColor2 = texture2D(uMatcapTexture2, uv);

    float transitionFactor = 0.2;

    float progress = smoothstep(
      uProgress - transitionFactor,
      uProgress,
      (vViewPosition.x + vViewPosition.y) * 0.5 + 0.5
    );

    vec4 matcapColor = mix(
      matcapColor2,
      matcapColor1,
      progress
    );
    `,
    );
  }

  function eyeOnBeforeCompile(shader) {
    shader.uniforms.uMatcapTexture1 = material.current.uMatcap1;
    shader.uniforms.uMatcapTexture2 = material.current.uMatcap2;
    shader.uniforms.uProgress = material.current.uProgress;
    shader.uniforms.uEyeTint = material.current.uEyeTint;

    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `
    uniform sampler2D uMatcapTexture1;
    uniform sampler2D uMatcapTexture2;
    uniform float uProgress;
    uniform float uEyeTint;

    void main() {
    `,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 matcapColor = texture2D( matcap, uv );",
      `
    vec4 matcapColor1 = texture2D(uMatcapTexture1, uv);
    vec4 matcapColor2 = texture2D(uMatcapTexture2, uv);

    float transitionFactor = 0.2;
    float progress = smoothstep(
      uProgress - transitionFactor,
      uProgress,
      (vViewPosition.x + vViewPosition.y) * 0.5 + 0.5
    );

    vec4 matcapColor = mix(matcapColor2, matcapColor1, progress);

    // ab tint sirf uEyeTint se control hota hai, position-wipe se independent
    matcapColor.rgb *= mix(vec3(1.0), vec3(0.0824), uEyeTint);
    `,
    );
  }

  eyeMaterial.onBeforeCompile = eyeOnBeforeCompile;

  branchMaterial.onBeforeCompile = branchOnBeforeCompile;

  dogMaterial.onBeforeCompile = onBeforeCompile;

  model.scene.traverse((child) => {
    const name = child.name.toLowerCase();
    if (name.includes("reye") || name.includes("leye")) {
      child.material = eyeMaterial;
    } else if (name.includes("dog")) {
      child.material = dogMaterial;
    } else {
      child.material = branchMaterial;
    }
  });

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-1",
        endTrigger: "#section-5",
        end: "bottom bottom",
        start: "top top",
        markers: true,
        scrub: true,
      },
    });
    tl.to(dogModel.current.scene.position, {
      z: "-=0.58",
      y: "+=0.1",
    })
      .to(dogModel.current.scene.rotation, {
        x: `+=${Math.PI / 15}`,
      })
      .to(
        dogModel.current.scene.rotation,
        {
          y: `-=${Math.PI}`,
        },
        "third",
      )
      .to(
        dogModel.current.scene.position,
        {
          x: "-=0.5",
          y: "-=0.01",
          z: "+=0.46",
        },
        "third",
      );
  }, []);

  useEffect(() => {
    document
      .querySelector(`.titles[img-title='tomorrowland']`)
      .addEventListener("mouseenter", () => {
        material.current.uMatcap1.value = mat19;
        branchTheme.current.uMatcap1.value = mat19;
        
        gsap.to([material.current.uProgress, branchTheme.current.uProgress], {
          value: 0.0,
          duration: 0.5,
          onComplete: () => {
            material.current.uMatcap2.value = material.current.uMatcap1.value;
            material.current.uProgress.value = 1.0;

            branchTheme.current.uMatcap2.value =
              branchTheme.current.uMatcap1.value;
            branchTheme.current.uProgress.value = 1.0;
          },
        });
        gsap.to(material.current.uEyeTint, {
          value: 0.0,
          duration: 0.5,
        });
      });
    document
      .querySelector(`.titles[img-title='navy-pier']`)
      .addEventListener("mouseenter", () => {
        material.current.uMatcap1.value = mat8;
        branchTheme.current.uMatcap1.value = mat8;
        
        gsap.to([material.current.uProgress, branchTheme.current.uProgress], {
          value: 0.0,
          duration: 0.5,
          onComplete: () => {
            material.current.uMatcap2.value = material.current.uMatcap1.value;
            material.current.uProgress.value = 1.0;

            branchTheme.current.uMatcap2.value =
              branchTheme.current.uMatcap1.value;
            branchTheme.current.uProgress.value = 1.0;
          },
        });
        gsap.to(material.current.uEyeTint, {
          value: 0.0,
          duration: 0.5,
        });
      });
    document
      .querySelector(`.titles[img-title='msi-chicago']`)
      .addEventListener("mouseenter", () => {
        material.current.uMatcap1.value = mat9;
        branchTheme.current.uMatcap1.value = mat9;
       
        gsap.to([material.current.uProgress, branchTheme.current.uProgress], {
          value: 0.0,
          duration: 0.5,
          onComplete: () => {
            material.current.uMatcap2.value = material.current.uMatcap1.value;
            material.current.uProgress.value = 1.0;

            branchTheme.current.uMatcap2.value =
              branchTheme.current.uMatcap1.value;
            branchTheme.current.uProgress.value = 1.0;
          },
        });
        gsap.to(material.current.uEyeTint, {
          value: 0.0,
          duration: 0.5,
        });
      });
    document
      .querySelector(`.titles[img-title='phone']`)
      .addEventListener("mouseenter", () => {
        material.current.uMatcap1.value = mat12;
        branchTheme.current.uMatcap1.value = mat12;
        
        gsap.to([material.current.uProgress, branchTheme.current.uProgress], {
          value: 0.0,
          duration: 0.5,
          onComplete: () => {
            material.current.uMatcap2.value = material.current.uMatcap1.value;
            material.current.uProgress.value = 1.0;

            branchTheme.current.uMatcap2.value =
              branchTheme.current.uMatcap1.value;
            branchTheme.current.uProgress.value = 1.0;
          },
        });
        gsap.to(material.current.uEyeTint, {
          value: 0.0,
          duration: 0.5,
        });
      });
    document
      .querySelector(`.titles[img-title='kikk']`)
      .addEventListener("mouseenter", () => {
        material.current.uMatcap1.value = mat10;
        branchTheme.current.uMatcap1.value = mat10;
        
        gsap.to([material.current.uProgress, branchTheme.current.uProgress], {
          value: 0.0,
          duration: 0.5,
          onComplete: () => {
            material.current.uMatcap2.value = material.current.uMatcap1.value;
            material.current.uProgress.value = 1.0;

            branchTheme.current.uMatcap2.value =
              branchTheme.current.uMatcap1.value;
            branchTheme.current.uProgress.value = 1.0;
          },
        });
        gsap.to(material.current.uEyeTint, {
          value: 0.0,
          duration: 0.5,
        });
      });
    document
      .querySelector(`.titles[img-title='kennedy']`)
      .addEventListener("mouseenter", () => {
        material.current.uMatcap1.value = mat8;
        branchTheme.current.uMatcap1.value = mat8;
      
        gsap.to([material.current.uProgress, branchTheme.current.uProgress], {
          value: 0.0,
          duration: 0.5,
          onComplete: () => {
            material.current.uMatcap2.value = material.current.uMatcap1.value;
            material.current.uProgress.value = 1.0;

            branchTheme.current.uMatcap2.value =
              branchTheme.current.uMatcap1.value;
            branchTheme.current.uProgress.value = 1.0;
          },
        });
        gsap.to(material.current.uEyeTint, {
          value: 0.0,
          duration: 0.5,
        });
      });
    document
      .querySelector(`.titles[img-title='opera']`)
      .addEventListener("mouseenter", () => {
        material.current.uMatcap1.value = mat13;
        branchTheme.current.uMatcap1.value = mat13;

        gsap.to([material.current.uProgress, branchTheme.current.uProgress], {
          value: 0.0,
          duration: 0.5,
          onComplete: () => {
            material.current.uMatcap2.value = material.current.uMatcap1.value;
            material.current.uProgress.value = 1.0;

            branchTheme.current.uMatcap2.value =
              branchTheme.current.uMatcap1.value;
            branchTheme.current.uProgress.value = 1.0;
          },
        });
        gsap.to(material.current.uEyeTint, {
          value: 0.0,
          duration: 0.5,
        });
      });
    document.querySelectorAll(`.titles`).forEach((title) => {
      title.addEventListener("mouseleave", () => {
        material.current.uMatcap1.value = mat2;
        branchTheme.current.uMatcap1.value = mat2;

        gsap.to([material.current.uProgress, branchTheme.current.uProgress], {
          value: 0.0,
          duration: 0.5,
          onComplete: () => {
            material.current.uMatcap2.value = material.current.uMatcap1.value;
            material.current.uProgress.value = 1.0;

            branchTheme.current.uMatcap2.value =
            branchTheme.current.uMatcap1.value;
            branchTheme.current.uProgress.value = 1.0;
          },
        });
        gsap.to(material.current.uEyeTint, {
          value: 1.0,
          duration: 0.5,
        });
      });
    });
  }, []);

  useEffect(() => {
  const handleMouseMove = (e) => {
    // -1 to 1 range mein normalize karo
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;

    // rotation ki max limit (radians) — chaho to values tweak kar lo
    const maxRotationY = 0.08;
    const maxRotationX = 0.05;

    targetRotation.current.y = x * maxRotationY;
    targetRotation.current.x = y * maxRotationX;
  };

  window.addEventListener("mousemove", handleMouseMove);

  return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
  if (!mouseGroup.current) return;

  mouseGroup.current.rotation.y +=
    (targetRotation.current.y - mouseGroup.current.rotation.y) * 0.05;

  mouseGroup.current.rotation.x +=
    (targetRotation.current.x - mouseGroup.current.rotation.x) * 0.05;
  });

  return (
    <>
      <group ref={mouseGroup}>
        <primitive
        object={model.scene}
        position={[0.2, -0.58, 0]}
        rotation={[0, Math.PI / 5, 0]}
      />
      </group>
      <directionalLight position={[0, 5, 5]} color={0xffffff} intensity={10} />
      {/* <OrbitControls /> */}
    </>
  );
};

export default Dog;
