"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";

/* =========================================================
   TYPES FOR 3D DIORAMA
========================================================= */

type StraightVehicle = {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  waypoints: THREE.Vector3[];
  legIndex: number;
  legProgress: number;
  speed: number;
};

type Pedestrian = {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  path: THREE.Vector3[];
  targetIndex: number;
  speed: number;
  stepPhase: number;
};

type Turbine = {
  blades: THREE.Group;
  speed: number;
};

/* =========================================================
   3D PROCEDURAL BUILDERS
========================================================= */

function createTree(x: number, z: number, scale = 1): THREE.Group {
  const group = new THREE.Group();

  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 6), trunkMat);
  trunk.position.y = 0.22;
  trunk.castShadow = true;
  group.add(trunk);

  const foliageMat = new THREE.MeshLambertMaterial({ color: 0x3ea85f });
  const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 7), foliageMat);
  cone1.position.y = 0.6;
  cone1.castShadow = true;
  group.add(cone1);

  const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.6, 7), foliageMat);
  cone2.position.y = 1.0;
  cone2.castShadow = true;
  group.add(cone2);

  const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 7), foliageMat);
  cone3.position.y = 1.35;
  cone3.castShadow = true;
  group.add(cone3);

  group.scale.set(scale, scale, scale);
  group.position.set(x, 0.48, z);
  return group;
}

function createStreetLamp(x: number, z: number, rotY = 0): THREE.Group {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.3, 6), poleMat);
  pole.position.y = 0.65;
  group.add(pole);

  const armMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), armMat);
  arm.position.set(0, 1.3, 0.15);
  group.add(arm);

  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff3a1 });
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.16), bulbMat);
  bulb.position.set(0, 1.28, 0.3);
  group.add(bulb);

  const lampLight = new THREE.PointLight(0xffea85, 1.4, 4.2, 1.8);
  lampLight.position.set(0, 1.25, 0.3);
  group.add(lampLight);

  group.rotation.y = rotY;
  group.position.set(x, 0.48, z);
  return group;
}

function createSmartBuilding(
  w: number,
  h: number,
  d: number,
  wallColor: number,
  roofColor: number,
  accentAwning?: number
): THREE.Group {
  const bldg = new THREE.Group();

  const wallMat = new THREE.MeshLambertMaterial({ color: wallColor });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  bldg.add(body);

  const roofMat = new THREE.MeshLambertMaterial({ color: roofColor });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.22, d + 0.12), roofMat);
  roof.position.y = h + 0.11;
  roof.castShadow = true;
  bldg.add(roof);

  // Solar panels on roof for smart city
  if (h > 2.8) {
    const solarMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 0.06, d * 0.45), solarMat);
    solarPanel.position.set(0, h + 0.25, 0);
    solarPanel.rotation.x = 0.15;
    bldg.add(solarPanel);
  }

  const rows = Math.floor(h / 0.82);
  const cols = Math.floor(w / 0.7);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isWarm = (r + c) % 2 === 0;
      const winMat = new THREE.MeshBasicMaterial({
        color: isWarm ? 0xfef08a : 0x7dd3fc,
      });
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.05), winMat);
      const xPos = -w / 2 + 0.32 + c * ((w - 0.64) / Math.max(cols - 1, 1));
      const yPos = 0.52 + r * 0.76;
      win.position.set(xPos, yPos, d / 2 + 0.02);
      bldg.add(win);
    }
  }

  if (accentAwning) {
    const awningMat = new THREE.MeshLambertMaterial({ color: accentAwning });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.1, 0.45), awningMat);
    awning.position.set(0, 0.75, d / 2 + 0.22);
    awning.rotation.x = 0.18;
    bldg.add(awning);
  }

  return bldg;
}

function createWindTurbine(x: number, z: number): { group: THREE.Group; turbine: Turbine } {
  const group = new THREE.Group();

  const poleMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 3.6, 8), poleMat);
  pole.position.y = 1.8;
  group.add(pole);

  const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.4), poleMat);
  nacelle.position.set(0, 3.6, 0);
  group.add(nacelle);

  const bladesGroup = new THREE.Group();
  bladesGroup.position.set(0, 3.6, 0.22);

  const bladeGeom = new THREE.BoxGeometry(0.08, 1.25, 0.02);
  bladeGeom.translate(0, 0.62, 0);
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });

  for (let b = 0; b < 3; b++) {
    const blade = new THREE.Mesh(bladeGeom, bladeMat);
    blade.rotation.z = (b * Math.PI * 2) / 3;
    bladesGroup.add(blade);
  }

  group.add(bladesGroup);
  group.position.set(x, 0.48, z);

  return {
    group,
    turbine: { blades: bladesGroup, speed: 0.04 },
  };
}

function createPedestrian(shirtColor: number, pantsColor: number): {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
} {
  const group = new THREE.Group();

  const headMat = new THREE.MeshLambertMaterial({ color: 0xfbcfe8 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), headMat);
  head.position.y = 0.52;
  head.castShadow = true;
  group.add(head);

  const hatMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const hat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), hatMat);
  hat.position.y = 0.58;
  group.add(hat);

  const torsoMat = new THREE.MeshLambertMaterial({ color: shirtColor });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.12), torsoMat);
  torso.position.y = 0.35;
  torso.castShadow = true;
  group.add(torso);

  const armGeom = new THREE.BoxGeometry(0.05, 0.18, 0.05);
  armGeom.translate(0, -0.08, 0);

  const leftArm = new THREE.Mesh(armGeom, torsoMat);
  leftArm.position.set(-0.12, 0.42, 0);
  const rightArm = new THREE.Mesh(armGeom, torsoMat);
  rightArm.position.set(0.12, 0.42, 0);
  group.add(leftArm, rightArm);

  const legGeom = new THREE.BoxGeometry(0.06, 0.24, 0.06);
  legGeom.translate(0, -0.11, 0);
  const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });

  const leftLeg = new THREE.Mesh(legGeom, pantsMat);
  leftLeg.position.set(-0.055, 0.24, 0);
  leftLeg.castShadow = true;

  const rightLeg = new THREE.Mesh(legGeom, pantsMat);
  rightLeg.position.set(0.055, 0.24, 0);
  rightLeg.castShadow = true;

  group.add(leftLeg, rightLeg);
  group.scale.set(0.85, 0.85, 0.85);

  return { group, leftLeg, rightLeg, leftArm, rightArm };
}

function createVehicle(type: "car" | "van", bodyColor: number): { group: THREE.Group; wheels: THREE.Mesh[] } {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const w = type === "van" ? 0.72 : 0.68;
  const h = type === "van" ? 0.62 : 0.42;
  const l = type === "van" ? 1.45 : 1.22;

  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), bodyMat);
  body.position.y = h / 2 + 0.14;
  body.castShadow = true;
  group.add(body);

  const cabinH = type === "van" ? 0.22 : 0.28;
  const cabinL = type === "van" ? 0.75 : 0.72;
  const cabinMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, cabinH, cabinL), cabinMat);
  cabin.position.set(0, body.position.y + h / 2 + cabinH / 2, type === "van" ? -0.15 : -0.05);
  cabin.castShadow = true;
  group.add(cabin);

  const glassMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, cabinH * 0.8, 0.04), glassMat);
  windshield.position.set(0, cabin.position.y, cabin.position.z + cabinL / 2 + 0.01);
  group.add(windshield);

  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), lightMat);
  hlL.position.set(-w * 0.32, body.position.y, l / 2 + 0.02);
  const hlR = hlL.clone();
  hlR.position.x = w * 0.32;
  group.add(hlL, hlR);

  const wheelGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12);
  wheelGeom.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

  const wheelPositions = [
    [-w / 2 - 0.02, 0.13, l * 0.32],
    [w / 2 + 0.02, 0.13, l * 0.32],
    [-w / 2 - 0.02, 0.13, -l * 0.32],
    [w / 2 + 0.02, 0.13, -l * 0.32],
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    wheels.push(wheel);
    group.add(wheel);
  });

  return { group, wheels };
}

/* =========================================================
   3D FULLSCREEN BACKGROUND DIORAMA CANVAS
========================================================= */

function FullscreenCityCanvas({
  canvasRef,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrame = 0;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf6f9fc);

      const aspect = window.innerWidth / window.innerHeight;
      const d = 14.5;
      const camera = new THREE.OrthographicCamera(
        -d * aspect,
        d * aspect,
        d,
        -d,
        -60,
        180
      );
      camera.position.set(30, 30, 30);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      /* Lights */
      const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.4);
      scene.add(ambientLight);

      const sun = new THREE.DirectionalLight(0xfffaed, 2.2);
      sun.position.set(24, 40, 20);
      sun.castShadow = true;
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      sun.shadow.bias = -0.0005;
      scene.add(sun);

      const fillLight = new THREE.DirectionalLight(0xbdd4f5, 0.8);
      fillLight.position.set(-18, 14, -18);
      scene.add(fillLight);

      const cityRoot = new THREE.Group();
      cityRoot.position.set(0, -0.5, -2);
      scene.add(cityRoot);

      /* Ground Base & Multi-Road Grid */
      const slabMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const slab = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 26), slabMat);
      slab.position.y = 0;
      slab.receiveShadow = true;
      cityRoot.add(slab);

      const roadMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
      const roadBed = new THREE.Mesh(new THREE.BoxGeometry(25.4, 0.05, 25.4), roadMat);
      roadBed.position.y = 0.41;
      roadBed.receiveShadow = true;
      cityRoot.add(roadBed);

      const blockMat = new THREE.MeshLambertMaterial({ color: 0xdce5ef });
      const blockCoords = [-7.8, 0, 7.8];
      const blockSize = 5.6;
      const blockGeom = new THREE.BoxGeometry(blockSize, 0.15, blockSize);

      blockCoords.forEach((bx) => {
        blockCoords.forEach((bz) => {
          const block = new THREE.Mesh(blockGeom, blockMat);
          block.position.set(bx, 0.48, bz);
          block.receiveShadow = true;
          block.castShadow = true;
          cityRoot.add(block);
        });
      });

      // Dashed lane dividers
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dashGeom = new THREE.PlaneGeometry(0.12, 0.6);
      dashGeom.rotateX(-Math.PI / 2);

      const addDividersZ = (roadX: number) => {
        for (let z = -11.5; z <= 11.5; z += 1.4) {
          if (Math.abs(z - -3.9) < 1.2 || Math.abs(z - 3.9) < 1.2) continue;
          const dash = new THREE.Mesh(dashGeom, dashMat);
          dash.position.set(roadX, 0.44, z);
          cityRoot.add(dash);
        }
      };

      const dashGeomH = new THREE.PlaneGeometry(0.6, 0.12);
      dashGeomH.rotateX(-Math.PI / 2);
      const addDividersX = (roadZ: number) => {
        for (let x = -11.5; x <= 11.5; x += 1.4) {
          if (Math.abs(x - -3.9) < 1.2 || Math.abs(x - 3.9) < 1.2) continue;
          const dash = new THREE.Mesh(dashGeomH, dashMat);
          dash.position.set(x, 0.44, roadZ);
          cityRoot.add(dash);
        }
      };

      addDividersZ(-3.9);
      addDividersZ(3.9);
      addDividersX(-3.9);
      addDividersX(3.9);

      // Crosswalks
      const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const createCrosswalk = (cx: number, cz: number, horizontal: boolean) => {
        for (let i = -0.9; i <= 0.9; i += 0.38) {
          const stripe = new THREE.Mesh(
            horizontal ? new THREE.PlaneGeometry(0.7, 0.18) : new THREE.PlaneGeometry(0.18, 0.7),
            zebraMat
          );
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(horizontal ? cx + i : cx, 0.45, horizontal ? cz : cz + i);
          cityRoot.add(stripe);
        }
      };

      [-3.9, 3.9].forEach((ax) => {
        [-3.9, 3.9].forEach((az) => {
          createCrosswalk(ax, az - 1.5, true);
          createCrosswalk(ax, az + 1.5, true);
          createCrosswalk(ax - 1.5, az, false);
          createCrosswalk(ax + 1.5, az, false);
        });
      });

      /* Buildings (Smart City Upgrades) */
      cityRoot.add(createSmartBuilding(2.4, 4.8, 2.4, 0xf1f5f9, 0x0284c7, 0x10b981).translateOnAxis(new THREE.Vector3(-8.5, 0.55, -8.5), 1));
      cityRoot.add(createSmartBuilding(2.0, 3.2, 2.0, 0x38bdf8, 0x0369a1).translateOnAxis(new THREE.Vector3(-6.8, 0.55, -6.8), 1));
      cityRoot.add(createSmartBuilding(3.2, 3.8, 2.2, 0xffffff, 0x10b981).translateOnAxis(new THREE.Vector3(0, 0.55, -7.8), 1));
      cityRoot.add(createSmartBuilding(2.6, 5.8, 2.6, 0x0369a1, 0x0c4a6e).translateOnAxis(new THREE.Vector3(8.2, 0.55, -8.2), 1));
      cityRoot.add(createSmartBuilding(2.0, 3.6, 2.0, 0x64748b, 0x1e293b, 0xf59e0b).translateOnAxis(new THREE.Vector3(6.8, 0.55, -6.6), 1));
      cityRoot.add(createSmartBuilding(2.6, 4.2, 3.4, 0x0ea5e9, 0x0369a1, 0x10b981).translateOnAxis(new THREE.Vector3(-7.8, 0.55, 0), 1));
      cityRoot.add(createSmartBuilding(3.4, 6.4, 3.4, 0x1e293b, 0x0284c7).translateOnAxis(new THREE.Vector3(0, 0.55, 0), 1));
      cityRoot.add(createSmartBuilding(2.8, 3.9, 3.2, 0xf8fafc, 0x059669).translateOnAxis(new THREE.Vector3(7.8, 0.55, 0), 1));
      cityRoot.add(createSmartBuilding(2.5, 3.6, 2.5, 0xfbcfe8, 0x0284c7).translateOnAxis(new THREE.Vector3(-8.2, 0.55, 8.2), 1));
      cityRoot.add(createSmartBuilding(2.0, 2.4, 2.0, 0xf59e0b, 0xd97706, 0xffffff).translateOnAxis(new THREE.Vector3(-6.6, 0.55, 6.8), 1));
      cityRoot.add(createSmartBuilding(3.2, 4.2, 2.4, 0x3b82f6, 0x1e40af, 0x10b981).translateOnAxis(new THREE.Vector3(0, 0.55, 7.8), 1));
      cityRoot.add(createSmartBuilding(2.8, 5.0, 2.8, 0xf1f5f9, 0x0284c7).translateOnAxis(new THREE.Vector3(8.2, 0.55, 8.2), 1));
      cityRoot.add(createSmartBuilding(2.0, 2.8, 2.0, 0x34d399, 0x059669).translateOnAxis(new THREE.Vector3(6.6, 0.55, 6.8), 1));

      // Wind Turbines (Renewable Clean Energy for Smart City)
      const turbines: Turbine[] = [];
      const turb1 = createWindTurbine(11.2, -8.2);
      const turb2 = createWindTurbine(-11.2, 8.2);
      cityRoot.add(turb1.group, turb2.group);
      turbines.push(turb1.turbine, turb2.turbine);

      // Trees
      const treeCoords = [
        [-11.5, -11.5, 1.1],
        [-11.5, 0, 0.95],
        [11.5, 0, 0.9],
        [11.5, 11.5, 1.0],
        [0, -11.5, 0.9],
        [0, 11.5, 0.9],
        [-5.8, -5.8, 0.85],
        [5.8, -5.8, 0.85],
        [-5.8, 5.8, 0.85],
        [5.8, 5.8, 0.85],
      ];
      treeCoords.forEach(([x, z, s]) => cityRoot.add(createTree(x, z, s)));

      // Street lamps
      const lampSpots = [
        [-4.8, -4.8, 0],
        [-3.0, -3.0, Math.PI],
        [4.8, -4.8, Math.PI / 2],
        [3.0, -3.0, -Math.PI / 2],
        [-4.8, 4.8, 0],
        [-3.0, 3.0, Math.PI],
        [4.8, 4.8, Math.PI / 2],
        [3.0, 3.0, -Math.PI / 2],
      ];
      lampSpots.forEach(([x, z, rot]) => cityRoot.add(createStreetLamp(x, z, rot)));

      /* Pedestrians */
      const pedestrianPool: Pedestrian[] = [];
      const personColors = [
        { shirt: 0xef4444, pants: 0x1e293b },
        { shirt: 0x3b82f6, pants: 0x475569 },
        { shirt: 0x10b981, pants: 0x334155 },
        { shirt: 0xf59e0b, pants: 0x1e1b4b },
        { shirt: 0x8b5cf6, pants: 0x0f172a },
        { shirt: 0xec4899, pants: 0x334155 },
      ];

      const walkPaths = [
        [new THREE.Vector3(-3.0, 0.55, -9.5), new THREE.Vector3(-3.0, 0.55, 1.5)],
        [new THREE.Vector3(-1.8, 0.55, -3.0), new THREE.Vector3(-1.8, 0.55, 3.0)],
        [new THREE.Vector3(3.0, 0.55, -9.5), new THREE.Vector3(3.0, 0.55, 1.5)],
        [new THREE.Vector3(-9.5, 0.55, 3.0), new THREE.Vector3(1.5, 0.55, 3.0)],
        [new THREE.Vector3(-1.5, 0.55, -3.0), new THREE.Vector3(9.5, 0.55, -3.0)],
        [new THREE.Vector3(1.8, 0.55, -2.0), new THREE.Vector3(1.8, 0.55, 2.0)],
      ];

      walkPaths.forEach((pathPoints, idx) => {
        const color = personColors[idx % personColors.length];
        const { group, leftLeg, rightLeg, leftArm, rightArm } = createPedestrian(
          color.shirt,
          color.pants
        );

        group.position.copy(pathPoints[0]);
        cityRoot.add(group);

        pedestrianPool.push({
          group,
          leftLeg,
          rightLeg,
          leftArm,
          rightArm,
          path: pathPoints,
          targetIndex: 1,
          speed: 0.006 + (idx % 3) * 0.002,
          stepPhase: Math.random() * Math.PI * 2,
        });
      });

      /* 100% STRAIGHT VEHICLE PATHS */
      const loop1: THREE.Vector3[] = [
        new THREE.Vector3(-11.5, 0.44, -3.3),
        new THREE.Vector3(11.5, 0.44, -3.3),
        new THREE.Vector3(11.5, 0.44, 4.5),
        new THREE.Vector3(-11.5, 0.44, 4.5),
      ];

      const loop2: THREE.Vector3[] = [
        new THREE.Vector3(-3.3, 0.44, -11.5),
        new THREE.Vector3(-3.3, 0.44, 11.5),
        new THREE.Vector3(4.5, 0.44, 11.5),
        new THREE.Vector3(4.5, 0.44, -11.5),
      ];

      const loop3: THREE.Vector3[] = [
        new THREE.Vector3(11.5, 0.44, -4.5),
        new THREE.Vector3(-11.5, 0.44, -4.5),
        new THREE.Vector3(-11.5, 0.44, 3.3),
        new THREE.Vector3(11.5, 0.44, 3.3),
      ];

      const vehicleRoutes = [loop1, loop2, loop3];
      const carColors = [0x0284c7, 0x10b981, 0xf59e0b, 0x3b82f6, 0xffffff, 0x8b5cf6, 0x06b6d4];
      const vehicles: StraightVehicle[] = [];

      for (let i = 0; i < 9; i++) {
        const isVan = i % 3 === 0;
        const { group: carGroup, wheels } = createVehicle(
          isVan ? "van" : "car",
          carColors[i % carColors.length]
        );
        cityRoot.add(carGroup);

        const route = vehicleRoutes[i % vehicleRoutes.length];
        const initialLeg = i % route.length;
        const initialProgress = ((i * 0.33) % 1);

        const startPt = route[initialLeg];
        const nextPt = route[(initialLeg + 1) % route.length];
        carGroup.position.lerpVectors(startPt, nextPt, initialProgress);

        const dir = new THREE.Vector3().subVectors(nextPt, startPt).normalize();
        const angle = Math.atan2(dir.x, dir.z);
        carGroup.rotation.y = angle;

        vehicles.push({
          group: carGroup,
          wheels,
          waypoints: route,
          legIndex: initialLeg,
          legProgress: initialProgress,
          speed: 0.016 + (i % 3) * 0.003,
        });
      }

      /* Controls */
      let mouseX = 0;
      let mouseY = 0;
      let targetRotX = 0;
      let targetRotY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        targetRotY = mouseX * 0.08;
        targetRotX = mouseY * 0.05;
      };

      const handleResize = () => {
        const curAspect = window.innerWidth / window.innerHeight;
        camera.left = -d * curAspect;
        camera.right = d * curAspect;
        camera.top = d;
        camera.bottom = -d;
        camera.updateProjectionMatrix();
        renderer?.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("resize", handleResize);

      /* Animation Loop */
      const animate = () => {
        cityRoot.rotation.y += (targetRotY - cityRoot.rotation.y) * 0.04;
        cityRoot.rotation.x += (targetRotX - cityRoot.rotation.x) * 0.04;

        // Spin wind turbines
        turbines.forEach((t) => {
          t.blades.rotation.z += t.speed;
        });

        // Vehicles
        vehicles.forEach((v) => {
          const fromPt = v.waypoints[v.legIndex];
          const toPt = v.waypoints[(v.legIndex + 1) % v.waypoints.length];
          const segmentLen = fromPt.distanceTo(toPt);

          v.legProgress += v.speed / segmentLen;

          if (v.legProgress >= 1) {
            v.legProgress = 0;
            v.legIndex = (v.legIndex + 1) % v.waypoints.length;
          }

          const curFrom = v.waypoints[v.legIndex];
          const curTo = v.waypoints[(v.legIndex + 1) % v.waypoints.length];

          v.group.position.lerpVectors(curFrom, curTo, v.legProgress);

          const dirX = curTo.x - curFrom.x;
          const dirZ = curTo.z - curFrom.z;
          v.group.rotation.y = Math.atan2(dirX, dirZ);

          v.wheels.forEach((w) => {
            w.rotation.x += v.speed * 4.5;
          });
        });

        // Pedestrians
        pedestrianPool.forEach((p) => {
          p.stepPhase += 0.05;
          const swing = Math.sin(p.stepPhase) * 0.4;

          p.leftLeg.rotation.x = swing;
          p.rightLeg.rotation.x = -swing;
          p.leftArm.rotation.x = -swing;
          p.rightArm.rotation.x = swing;

          const target = p.path[p.targetIndex];
          const dir = new THREE.Vector3().subVectors(target, p.group.position);
          const dist = dir.length();

          if (dist < 0.12) {
            p.targetIndex = p.targetIndex === 0 ? 1 : 0;
          } else {
            dir.normalize();
            p.group.position.addScaledVector(dir, p.speed);
            p.group.lookAt(target.x, p.group.position.y, target.z);
          }
        });

        renderer?.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        renderer?.dispose();
      };
    } catch (err) {
      console.warn("City 3D canvas failed to load:", err);
    }
  }, [canvasRef]);

  return null;
}

/* =========================================================
   PAGE COMPONENT: ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const router = useRouter();

  const [message, setMessage] = useState("Loading...");
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      setMessage("You are not logged in as an admin.");
      return;
    }

    const fetchAdminData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/test/admin-only",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message);
          return;
        }

        setMessage(data.message);
        setUserId(data.user.id);
        setRole(data.user.role);
      } catch (error) {
        console.error("Admin dashboard error:", error);
        setMessage("Unable to connect to the server");
      }
    };

    fetchAdminData();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f9fc] text-[#10233f]">
      {/* 3D CITY LIVING DIORAMA CANVAS */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      <FullscreenCityCanvas canvasRef={canvasRef} />

      {/* Atmospheric Soft Vignette */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-t from-[#f6f9fc]/80 via-transparent to-[#f6f9fc]/40" />

      {/* Animated Glow Blobs */}
      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
        <div className="animate-float-slow absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#0b4f9c]/10 blur-3xl" />
        <div className="animate-float absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-[#39b54a]/10 blur-3xl" />
      </div>

      {/* TOP HEADER */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 sm:px-12 lg:px-16">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="UrbanSathi"
            className="w-[170px] object-contain drop-shadow sm:w-[190px]"
          />
        </div>

        <button
          onClick={handleSignOut}
          className="rounded-2xl border border-rose-200 bg-white/90 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 shadow-sm backdrop-blur-md transition hover:bg-rose-50 active:scale-95"
        >
          Sign Out
        </button>
      </header>

      {/* DASHBOARD CONTENT OVERLAY */}
      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-6 py-8 sm:px-12">
        <div className="animate-slide-up w-full max-w-[560px]">
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-[0_25px_70px_rgba(10,40,80,0.12)] backdrop-blur-xl sm:p-10">
            {/* Admin Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#39b54a]/20 bg-[#e8f7ec] px-4 py-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#39b54a]" />
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#16852b]">
                Smart City Admin Control
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-[#10233f] sm:text-4xl">
              UrbanSathi Admin Dashboard
            </h1>

            {/* Server Message Banner */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-medium text-slate-700">
              <span className="block text-xs uppercase tracking-wider text-slate-400">Server Status</span>
              <span className="mt-1 block text-base font-semibold text-[#0875c9]">{message}</span>
            </div>

            {/* Authenticated Admin Stats */}
            {userId && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left">
                  <span className="text-xs uppercase tracking-wider text-slate-400">Admin ID</span>
                  <p className="mt-1 text-2xl font-bold text-[#10233f]">#{userId}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left">
                  <span className="text-xs uppercase tracking-wider text-slate-400">Privilege Role</span>
                  <p className="mt-1 text-2xl font-bold uppercase text-[#16852b]">{role}</p>
                </div>
              </div>
            )}

            {/* Civic Metrics */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-ping rounded-full bg-[#10b981]" />
                <span>Smart Grid: Active</span>
              </div>
              <span>Clean Transit: 100% Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -18px, 0);
          }
        }

        @keyframes floatSlow {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(20px, 15px, 0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float 7s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: floatSlow 9s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slideUp 0.7s ease-out both;
        }
      `}</style>
    </main>
  );
}