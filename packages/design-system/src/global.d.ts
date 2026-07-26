/* eslint-disable @typescript-eslint/no-explicit-any */

// @react-three/fiber@8.x augments the legacy global JSX.IntrinsicElements
// namespace, but React 19 moved JSX types into React.JSX. This declaration
// re-exports the Three.js primitive elements so TypeScript recognises them
// inside <Canvas> components.
declare namespace React.JSX {
  interface IntrinsicElements {
    ambientLight: any;
    pointLight: any;
    spotLight: any;
    directionalLight: any;
    rectAreaLight: any;
    hemisphereLight: any;
    mesh: any;
    group: any;
    line: any;
    primitive: any;
  }
}
