"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
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

function createBuilding(
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

  if (h > 2.8) {
    const tankMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.45, 8), tankMat);
    tank.position.set(w * 0.22, h + 0.35, -d * 0.2);
    tank.castShadow = true;
    bldg.add(tank);
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

function createGuardCharacter(): THREE.Group {
  const guard = new THREE.Group();

  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.25), bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  guard.add(body);

  const headMat = new THREE.MeshLambertMaterial({ color: 0xfbcfe8 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), headMat);
  head.position.y = 0.9;
  head.castShadow = true;
  guard.add(head);

  const capMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.08, 12), capMat);
  cap.position.y = 1.05;
  guard.add(cap);

  const visorMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.1), visorMat);
  visor.position.set(0, 1.03, 0.12);
  guard.add(visor);

  const vestMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.35, 0.27), vestMat);
  vest.position.y = 0.52;
  guard.add(vest);

  const armMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4), armMat);
  arm.position.set(-0.24, 0.65, 0);
  arm.rotation.z = -Math.PI / 4;
  guard.add(arm);

  guard.position.set(0, 0.45, 5);
  return guard;
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

  const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), tailMat);
  tlL.position.set(-w * 0.32, body.position.y, -l / 2 - 0.01);
  const tlR = tlL.clone();
  tlR.position.x = w * 0.32;
  group.add(tlL, tlR);

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
   SCROLL-DRIVEN & MOUSE PARALLAX 3D CITY CANVAS
========================================================= */

function ScrollableCityCanvas({
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

      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;

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
      renderer.setSize(width, height);

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
      cityRoot.position.set(0, -0.5, 0);
      scene.add(cityRoot);

      // Add Municipal Guard
      const guard = createGuardCharacter();
      cityRoot.add(guard);

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

      cityRoot.add(createBuilding(2.4, 4.8, 2.4, 0xf1f5f9, 0x0284c7, 0xf97316).translateOnAxis(new THREE.Vector3(-8.5, 0.55, -8.5), 1));
      cityRoot.add(createBuilding(2.0, 3.2, 2.0, 0x38bdf8, 0x0369a1).translateOnAxis(new THREE.Vector3(-6.8, 0.55, -6.8), 1));
      cityRoot.add(createBuilding(3.2, 3.8, 2.2, 0xffffff, 0x10b981).translateOnAxis(new THREE.Vector3(0, 0.55, -7.8), 1));
      cityRoot.add(createBuilding(2.6, 5.8, 2.6, 0x0369a1, 0x0c4a6e).translateOnAxis(new THREE.Vector3(8.2, 0.55, -8.2), 1));
      cityRoot.add(createBuilding(2.0, 3.6, 2.0, 0x64748b, 0x1e293b, 0xf59e0b).translateOnAxis(new THREE.Vector3(6.8, 0.55, -6.6), 1));
      cityRoot.add(createBuilding(2.6, 4.2, 3.4, 0x0ea5e9, 0x0369a1, 0xef4444).translateOnAxis(new THREE.Vector3(-7.8, 0.55, 0), 1));
      cityRoot.add(createBuilding(3.4, 6.4, 3.4, 0x1e293b, 0x0284c7).translateOnAxis(new THREE.Vector3(0, 0.55, 0), 1));
      cityRoot.add(createBuilding(2.8, 3.9, 3.2, 0xf8fafc, 0x059669).translateOnAxis(new THREE.Vector3(7.8, 0.55, 0), 1));
      cityRoot.add(createBuilding(2.5, 3.6, 2.5, 0xfbcfe8, 0xdb2777).translateOnAxis(new THREE.Vector3(-8.2, 0.55, 8.2), 1));
      cityRoot.add(createBuilding(2.0, 2.4, 2.0, 0xf59e0b, 0xd97706, 0xffffff).translateOnAxis(new THREE.Vector3(-6.6, 0.55, 6.8), 1));
      cityRoot.add(createBuilding(3.2, 4.2, 2.4, 0x3b82f6, 0x1e40af, 0xf97316).translateOnAxis(new THREE.Vector3(0, 0.55, 7.8), 1));
      cityRoot.add(createBuilding(2.8, 5.0, 2.8, 0xf1f5f9, 0x0284c7).translateOnAxis(new THREE.Vector3(8.2, 0.55, 8.2), 1));
      cityRoot.add(createBuilding(2.0, 2.8, 2.0, 0x34d399, 0x059669).translateOnAxis(new THREE.Vector3(6.6, 0.55, 6.8), 1));

      const treeCoords = [
        [-11.5, -11.5, 1.1],
        [-11.5, 0, 0.95],
        [-11.5, 11.5, 1.05],
        [11.5, -11.5, 1.1],
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
      const carColors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981, 0xffffff, 0x8b5cf6, 0x06b6d4];
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

      /* Scroll & Mouse Interactivity Parameters */
      let scrollProgress = 0;
      let mouseX = 0;
      let mouseY = 0;
      let mouseTiltX = 0;
      let mouseTiltY = 0;

      const handleScroll = () => {
        const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollMax <= 0) return;
        scrollProgress = window.scrollY / scrollMax;
      };

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        mouseTiltY = mouseX * 0.12;
        mouseTiltX = mouseY * 0.08;
      };

      const handleResize = () => {
        const curWidth = window.innerWidth;
        const curHeight = window.innerHeight;
        const curAspect = curWidth / curHeight;

        camera.left = -d * curAspect;
        camera.right = d * curAspect;
        camera.top = d;
        camera.bottom = -d;
        camera.updateProjectionMatrix();

        if (renderer) {
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          renderer.setSize(curWidth, curHeight);
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("resize", handleResize);

      const animate = () => {
        const targetRotY = scrollProgress * Math.PI * 1.2 + mouseTiltY;
        const targetRotX = mouseTiltX;
        const targetCamY = 30 - scrollProgress * 14;
        const targetCamZ = 30 - scrollProgress * 10;

        cityRoot.rotation.y += (targetRotY - cityRoot.rotation.y) * 0.05;
        cityRoot.rotation.x += (targetRotX - cityRoot.rotation.x) * 0.05;

        camera.position.y += (targetCamY - camera.position.y) * 0.05;
        camera.position.z += (targetCamZ - camera.position.z) * 0.05;
        camera.lookAt(0, 0, 0);

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
        window.removeEventListener("scroll", handleScroll);
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
   PAGE COMPONENT: UNIFIED LOGIN WITH SCROLL JOURNEY
========================================================= */

export default function UnifiedLoginPage() {
  const router = useRouter();

  type LoginRole = "CITIZEN" | "EMPLOYEE" | "ADMIN";
  const [role, setRole] = useState<LoginRole>("CITIZEN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const roleDetails = {
    CITIZEN: {
      title: "Citizen Portal",
      subtitle: "Report civic issues and track your complaints in real time.",
      emailLabel: "Email address",
      placeholder: "you@gmail.com",
      button: "Sign in as Citizen",
      endpoint: "/api/auth/login",
      destination: "/citizen/dashboard",
      helper: "Access your account to report and track civic complaints.",
    },
    EMPLOYEE: {
      title: "Employee Portal",
      subtitle: "Manage and resolve complaints assigned to your department.",
      emailLabel: "Employee email",
      placeholder: "employee@urbansathi.com",
      button: "Sign in as Employee",
      endpoint: "/api/auth/employee-login",
      destination: "/employee/dashboard",
      helper: "Authorized UrbanSathi department employees only.",
    },
    ADMIN: {
      title: "Administration Portal",
      subtitle: "Oversee departments, city staff, and municipal metrics.",
      emailLabel: "Administrator email",
      placeholder: "admin@urbansathi.com",
      button: "Sign in as Admin",
      endpoint: "/api/auth/admin-login",
      destination: "/admin/dashboard",
      helper: "Authorized administrators only.",
    },
  } as const;

  const selectedRole = roleDetails[role];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
      const response = await fetch(`${apiBase}${selectedRole.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `${role.charAt(0) + role.slice(1).toLowerCase()} login failed.`
        );
      }

      if (!data.token) {
        throw new Error("The server did not return an authentication token.");
      }

      const actualRole = data.user?.role as string | undefined;
      if (!actualRole || actualRole !== role) {
        throw new Error(
          actualRole
            ? `This account is registered as ${actualRole.toLowerCase()}. Select the correct role and try again.`
            : "The server response did not include the account role. Please try again."
        );
      }

      if (role === "CITIZEN") {
        localStorage.setItem("citizenToken", data.token);
        sessionStorage.removeItem("citizenToken");
      } else if (role === "EMPLOYEE") {
        localStorage.setItem("employeeToken", data.token);
        sessionStorage.removeItem("employeeToken");

        if (data.user) {
          localStorage.setItem("employeeUser", JSON.stringify(data.user));
        }
      } else if (role === "ADMIN") {
        localStorage.setItem("adminToken", data.token);
        sessionStorage.removeItem("adminToken");
      }

      router.replace(selectedRole.destination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  const scrollToSignIn = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <main className="relative min-h-[400vh] bg-[#f6f9fc] selection:bg-[#0875c9] selection:text-white">
      {/* 3D Background Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      <ScrollableCityCanvas canvasRef={canvasRef} />

      <div className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-[#f6f9fc]/80 via-transparent to-[#f6f9fc]/90" />

      {/* Top Header */}
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 lg:px-16 backdrop-blur-md bg-white/50 border-b border-slate-200/40">
        <div className="flex items-center gap-3">
          
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-slate-500 sm:inline-block">
            Smart Municipal Network
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            System Live
          </span>
          <button
            onClick={scrollToSignIn}
            className="rounded-full bg-[#0875c9] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b4f9c]"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* STAGE 1: CLEAR 3D CITY + GUARD Speech Bubble (0% Scroll) */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-end pb-16 text-center">
        {/* Speech Bubble from Municipal Guard */}
        <div className="relative mb-6 rounded-2xl border border-white/90 bg-white/90 px-6 py-3.5 shadow-[0_15px_40px_rgba(10,40,80,0.12)] backdrop-blur-xl animate-bounce">
          <p className="text-xs font-bold text-[#10233f]">
            👮‍♂️ City Patrol: "Welcome to UrbanSathi! Scroll down to enter!"
          </p>
          <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-white/90 bg-white/90" />
        </div>

        <div className="flex flex-col items-center gap-1.5 text-xs font-semibold text-[#0875c9]">
          <span>Scroll down to enter city portal</span>
          <svg className="h-4 w-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* STAGE 2: WELCOME HERO CARD (Scroll Screen 2) */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl rounded-3xl border border-white/80 bg-white/75 p-8 shadow-[0_20px_60px_rgba(10,40,80,0.1)] backdrop-blur-2xl sm:p-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#39b54a]/20 bg-[#e8f7ec] px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#39b54a]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#16852b]">
              UrbanSathi Platform
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#10233f] sm:text-6xl">
            Welcome to UrbanSathi
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            One unified platform connecting citizens, municipal staff, and city leaders for a cleaner, smarter, better-managed city.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={scrollToSignIn}
              className="rounded-xl bg-gradient-to-r from-[#0b4f9c] to-[#0875c9] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0875c9]/25 transition hover:brightness-105"
            >
              Sign In to Your Account
            </button>
          </div>
        </div>
      </section>

      {/* STAGE 3: INTERACTIVE CIVIC METRICS (Scroll Screen 3) */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-4xl rounded-3xl border border-white/80 bg-white/75 p-8 shadow-[0_25px_70px_rgba(10,40,80,0.1)] backdrop-blur-2xl sm:p-12">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0875c9]">
              Real-Time Civic Infrastructure
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-[#10233f] sm:text-4xl">
              Smarter City Operations
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
              Explore how UrbanSathi streamlines municipal complaints, dispatches field employees, and maintains operational transparency.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-[#0875c9]">98.4%</p>
              <p className="mt-1 text-xs font-semibold text-[#10233f]">Resolution Rate</p>
              <p className="mt-1 text-[11px] text-slate-500">Over 12,000 resolved civic tickets</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-[#39b54a]">24/7</p>
              <p className="mt-1 text-xs font-semibold text-[#10233f]">Active Dispatch</p>
              <p className="mt-1 text-[11px] text-slate-500">Automated employee routing</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-[#10233f]">15k+</p>
              <p className="mt-1 text-xs font-semibold text-[#10233f]">Active Citizens</p>
              <p className="mt-1 text-[11px] text-slate-500">Engaged urban community</p>
            </div>
          </div>
        </div>
      </section>

      {/* STAGE 4: UNIFIED SIGN-IN PORTAL (Scroll Screen 4 - Bottom) */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-20">
        <div className="w-full max-w-[460px] rounded-3xl border border-white/90 bg-white/90 p-6 shadow-[0_30px_90px_rgba(10,40,80,0.15)] backdrop-blur-2xl sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#10233f]">Sign in to UrbanSathi</h2>
            <p className="mt-1 text-xs text-slate-500">Choose your account type to continue</p>
          </div>

          <div
            role="tablist"
            aria-label="Choose account type"
            className="mb-6 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100/80 p-1.5 backdrop-blur-sm"
          >
            {([
              ["CITIZEN", "Citizen"],
              ["EMPLOYEE", "Employee"],
              ["ADMIN", "Admin"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={role === value}
                onClick={() => {
                  setRole(value);
                  setError("");
                }}
                className={`rounded-xl px-2.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  role === value
                    ? "bg-white text-[#0875c9] shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-slate-200/80"
                    : "text-slate-500 hover:text-[#203653]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-600">
            {selectedRole.subtitle}
          </p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                {selectedRole.emailLabel}
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole.placeholder}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10233f] placeholder-slate-400 shadow-sm transition focus:border-[#0875c9] focus:outline-none focus:ring-2 focus:ring-[#0875c9]/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-[#0875c9] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-[#10233f] placeholder-slate-400 shadow-sm transition focus:border-[#0875c9] focus:outline-none focus:ring-2 focus:ring-[#0875c9]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0b4f9c] to-[#0875c9] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(8,117,201,0.3)] transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>{selectedRole.button}</span>
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {role === "CITIZEN" && (
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Don't have an account?{" "}
                <a href="/register" className="font-semibold text-[#0875c9] hover:underline">
                  Create account
                </a>
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <svg className="h-3 w-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Your session is securely encrypted & protected
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}