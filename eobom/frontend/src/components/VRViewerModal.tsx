import React, { useState, useRef, useEffect } from 'react';
import { X, Eye, Compass, ZoomIn, ZoomOut, RotateCcw, MapPin, Sparkles } from 'lucide-react';

interface VRScene {
  id: string;
  title: string;
  url: string;
}

interface VRViewerModalProps {
  facilityName: string;
  scenes: VRScene[];
  onClose: () => void;
}

export const VRViewerModal: React.FC<VRViewerModalProps> = ({ facilityName, scenes, onClose }) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [yaw, setYaw] = useState(0); // 0 ~ 360도
  const [pitch, setPitch] = useState(0); // -80 ~ 80도
  const [fov, setFov] = useState(1.0); // 0.5 (Zoom in) ~ 1.8 (Zoom out)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeScene = scenes[activeSceneIndex] || scenes[0];

  // 3D 구형 WebGL 렌더러 참조
  const webglRef = useRef<{
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    texture: WebGLTexture;
    uniforms: { [key: string]: WebGLUniformLocation };
    isTextureLoaded: boolean;
  } | null>(null);

  // 자동 회전 루프 (Auto-Rotate)
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 0.25) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  // WebGL 셰이더 및 컨텍스트 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    // 버텍스 셰이더 (전체 화면 사각형)
    const vsSource = `
      attribute vec2 aPosition;
      varying vec2 vUV;
      void main() {
        vUV = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // 프래그먼트 셰이더 (360° 파노라마 구형 구면 투영 파이프라인)
    const fsSource = `
      precision mediump float;
      varying vec2 vUV;
      uniform sampler2D uTexture;
      uniform float uYaw;
      uniform float uPitch;
      uniform float uFov;
      uniform float uAspect;

      #define PI 3.14159265359

      void main() {
        // 화면 중앙 기준 정규화 (Aspect ratio 및 FOV 반영)
        vec2 st = (vUV - vec2(0.5, 0.5)) * vec2(uAspect, 1.0) * uFov;

        // 시선 레이 3D 방향 벡터
        vec3 ray = normalize(vec3(st.x, -st.y, 1.0));

        // Pitch 회전 (X축)
        float cp = cos(uPitch);
        float sp = sin(uPitch);
        vec3 r1 = vec3(ray.x, ray.y * cp - ray.z * sp, ray.y * sp + ray.z * cp);

        // Yaw 회전 (Y축)
        float cy = cos(uYaw);
        float sy = sin(uYaw);
        vec3 r2 = vec3(r1.x * cy + r1.z * sy, r1.y, -r1.x * sy + r1.z * cy);

        // 3D 레이 ➔ 구면 구형 경도(lon)/위도(lat) 좌표 변환
        float lon = atan(r2.x, r2.z);
        float lat = asin(clamp(r2.y, -1.0, 1.0));

        // Equirectangular 파노라마 2D 텍스처 좌표 (0 ~ 1)
        vec2 texCoord = vec2((lon + PI) / (2.0 * PI), (lat + PI / 2.0) / PI);

        gl_FragColor = texture2D(uTexture, texCoord);
      }
    `;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vertShader || !fragShader) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // 사각형 버텍스 버퍼 (Full-screen Quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 텍스처 필터링 설정 (기본 더미 픽셀)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([30, 41, 59, 255])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uniforms = {
      uTexture: gl.getUniformLocation(program, 'uTexture')!,
      uYaw: gl.getUniformLocation(program, 'uYaw')!,
      uPitch: gl.getUniformLocation(program, 'uPitch')!,
      uFov: gl.getUniformLocation(program, 'uFov')!,
      uAspect: gl.getUniformLocation(program, 'uAspect')!
    };

    webglRef.current = {
      gl,
      program,
      texture,
      uniforms,
      isTextureLoaded: false
    };
  }, []);

  // 씬 바뀔 때 파노라마 이미지 텍스처 로드
  useEffect(() => {
    if (!webglRef.current || !activeScene.url) return;

    const { gl, texture } = webglRef.current;
    webglRef.current.isTextureLoaded = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!webglRef.current) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      webglRef.current.isTextureLoaded = true;
      renderFrame();
    };
    img.src = activeScene.url;
  }, [activeSceneIndex]);

  // 프레임 렌더링 함수
  const renderFrame = () => {
    const canvas = canvasRef.current;
    const ref = webglRef.current;
    if (!canvas || !ref) return;

    const { gl, program, uniforms } = ref;

    // 캔버스 크기 맞춤
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    gl.useProgram(program);

    // 각도 라디안 변환
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;
    const aspect = width / (height || 1);

    gl.uniform1i(uniforms.uTexture, 0);
    gl.uniform1f(uniforms.uYaw, yawRad);
    gl.uniform1f(uniforms.uPitch, pitchRad);
    gl.uniform1f(uniforms.uFov, fov);
    gl.uniform1f(uniforms.uAspect, aspect);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  // Yaw, Pitch, FOV 변경 시 프레임 업데이트
  useEffect(() => {
    renderFrame();
  }, [yaw, pitch, fov]);

  // 마우스 드래그 이벤트를 통한 자유 3D 회전
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setYaw((prev) => (prev - deltaX * 0.25 + 360) % 360);
    setPitch((prev) => Math.max(-80, Math.min(80, prev + deltaY * 0.25)));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setFov((prev) => Math.max(prev - 0.2, 0.4));
  const handleZoomOut = () => setFov((prev) => Math.min(prev + 0.2, 1.8));
  const handleReset = () => {
    setYaw(0);
    setPitch(0);
    setFov(1.0);
  };

  // 공간 핫스팟 (3D 회전 각도 연동)
  const hotspots = [
    { id: 'altar', title: '영정 제단 & 생화 특대', yaw: 45, pitch: 5, info: '최신 멀티미디어 영정 스크린 및 최고급 생화 제단 세팅' },
    { id: 'rest', title: '유족 전용 휴게실 & 샤워부스', yaw: 180, pitch: -10, info: '24시간 온돌 침상, 독립형 샤워 시설 및 바디프랜드 안마의자 설치' },
    { id: 'dining', title: '접객 전용 라운지 (250석)', yaw: 290, pitch: -5, info: '최대 250석 대규모 수용, 정찰제 음식 서비스 및 전자 방명록' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 2500,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        color: '#FFFFFF'
      }}
    >
      {/* 상단 헤더 툴바 */}
      <div
        style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ backgroundColor: 'var(--point-color)', color: '#1E293B', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={14} /> REAL 360° SPHERICAL VR
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{facilityName}</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '0.2rem 0 0 0' }}>
            마우스를 드래그하여 360° 실제 입체 구형 공간을 둘러보세요. (현재 뷰: <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{activeScene.title}</span>)
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>
      </div>

      {/* WebGL 360° 입체 파노라마 메인 뷰어 */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#000000'
        }}
      >
        {/* WebGL Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />

        {/* 3D 핫스팟 마커 (카메라 3D 좌표 투영) */}
        {hotspots.map((hs) => {
          let relYaw = ((hs.yaw - yaw + 540) % 360) - 180;
          let relPitch = hs.pitch - pitch;

          // 시야 정면 75도 이내의 핫스팟만 표시
          if (Math.abs(relYaw) > 65 || Math.abs(relPitch) > 50) return null;

          const posX = 50 + (relYaw / 65) * 40 * (1 / fov);
          const posY = 50 - (relPitch / 50) * 35 * (1 / fov);

          return (
            <div
              key={hs.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedHotspot(hs.id === selectedHotspot ? null : hs.id);
              }}
              style={{
                position: 'absolute',
                left: `${posX}%`,
                top: `${posY}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.9)',
                  color: '#FFFFFF',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 0 15px rgba(217, 119, 6, 0.8)',
                  border: '2px solid #FFFFFF'
                }}
              >
                <Eye size={14} /> {hs.title}
              </div>

              {selectedHotspot === hs.id && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '120%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#FFFFFF',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    width: '230px',
                    fontSize: '0.8rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <p style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--accent-gold)' }}>📍 {hs.title}</p>
                  <p style={{ color: '#CBD5E1', margin: 0, lineHeight: '1.3' }}>{hs.info}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* 좌측 상단 방위각 표시 뱃지 */}
        <div
          style={{
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            backgroundColor: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '0.6rem 1rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.85rem',
            border: '1px solid rgba(255,255,255,0.15)'
          }}
        >
          <Compass size={18} style={{ transform: `rotate(${-yaw}deg)` }} color="var(--accent-gold)" />
          <span>시점: {Math.round(yaw)}° (고개 {Math.round(pitch)}°)</span>
        </div>

        {/* 우측 컨트롤 도구 모음 */}
        <div
          style={{
            position: 'absolute',
            right: '1.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            backgroundColor: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '0.6rem',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.15)'
          }}
        >
          <button onClick={handleZoomIn} title="확대" style={{ background: 'none', border: 'none', color: '#FFF', padding: '0.5rem', cursor: 'pointer' }}>
            <ZoomIn size={20} />
          </button>
          <button onClick={handleZoomOut} title="축소" style={{ background: 'none', border: 'none', color: '#FFF', padding: '0.5rem', cursor: 'pointer' }}>
            <ZoomOut size={20} />
          </button>
          <button onClick={handleReset} title="초기화" style={{ background: 'none', border: 'none', color: '#FFF', padding: '0.5rem', cursor: 'pointer' }}>
            <RotateCcw size={20} />
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="자동회전"
            style={{
              background: autoRotate ? 'var(--point-color)' : 'none',
              color: autoRotate ? '#1E293B' : '#FFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Compass size={20} />
          </button>
        </div>
      </div>

      {/* 하단 공간 탭 선택 바 */}
      <div
        style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          overflowX: 'auto'
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#94A3B8', whiteSpace: 'nowrap', fontWeight: 600 }}>
          공간 이동:
        </span>
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            onClick={() => {
              setActiveSceneIndex(index);
              setSelectedHotspot(null);
            }}
            style={{
              backgroundColor: activeSceneIndex === index ? 'var(--point-color)' : 'rgba(255, 255, 255, 0.1)',
              color: activeSceneIndex === index ? '#1E293B' : '#FFFFFF',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <MapPin size={16} /> {scene.title}
          </button>
        ))}
      </div>
    </div>
  );
};
