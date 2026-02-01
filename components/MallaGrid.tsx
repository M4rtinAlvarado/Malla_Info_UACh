import React, { useState } from "react";

interface Asignatura {
  codigo: string;
  nombre: string;
  creditos: number;
  prerrequisitos: string[];
  descripcion: string;
  area: string;
}

interface Semestre {
  semestre: number;
  asignaturas: Asignatura[];
  semestreContinuo?: number;
}

interface Malla {
  carrera: string;
  años: { semestres: Semestre[] }[];
}

interface Props {
  malla: Malla;
  onAsignaturaClick?: (asignatura: Asignatura) => void;
  aprobadas?: string[];
  isDesbloqueada?: (asig: Asignatura) => boolean;
  onTacharSemestre?: (asignaturas: Asignatura[]) => void;
  enCurso?: string[];
  onAsignaturaCursoClick?: (asig: Asignatura) => void;
  creditosEnCurso?: number;
}

// Escala de verdes pastel de claro a oscuro (11 tonos)
const verdeScale = [
  "#e6f9e6", // 1 - muy claro
  "#d0f5df", // 2
  "#c2f0cb", // 3
  "#a6eec0", // 4
  "#8ee6b0", // 5
  "#6fdc9c", // 6
  "#4fc97e", // 7
  "#38b36b", // 8
  "#259a57", // 9
  "#1b7a43", // 10
  "#145c32"  // 11 - más oscuro
];

const textColorForBg = (idx: number) => (idx < 6 ? "#205c36" : "#fff");

const MallaGrid: React.FC<Props> = ({ malla, onAsignaturaClick, aprobadas = [], isDesbloqueada, onTacharSemestre, enCurso, onAsignaturaCursoClick, creditosEnCurso }) => {
  // Unificar todos los semestres en un solo array plano y numerarlos de forma continua
  const semestres: Semestre[] = malla.años.flatMap((a) => a.semestres);
  // Ordenar por año y semestre original
  const semestresContinuos = semestres.map((sem, idx) => ({ ...sem, semestreContinuo: idx + 1 }));
  const [showHelp, setShowHelp] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  React.useEffect(() => {
    const checkTouch = () => {
      if (typeof window !== 'undefined') {
        const isTouchDevice =
          (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
          (!!navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
        setIsTouch(isTouchDevice);
      }
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  return (
    <div
      style={{
        background: "#e6f9e6",
        minHeight: "100vh",
        padding: 32,
        fontFamily: "Segoe UI, Arial, sans-serif"
      }}
    >
      {/* Botón de ayuda flotante */}
      <button
        onClick={() => setShowHelp(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: '#259a57',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 56,
          height: 56,
          fontSize: 28,
          fontWeight: 700,
          boxShadow: '0 2px 8px #259a5755',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        aria-label="Ayuda"
        title="Ayuda"
      >
        ?
      </button>
      {/* Modal de ayuda */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
          onClick={() => setShowHelp(false)}
        >
          <div
            className="modal-ayuda"
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: '32px 24px',
              maxWidth: 800,
              minWidth: 220,
              width: '90vw',
              boxShadow: '0 4px 24px #0002',
              position: 'relative',
              color: '#205c36',
              fontSize: 17,
              fontWeight: 400,
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 26,
                color: '#259a57',
                cursor: 'pointer',
                fontWeight: 700,
                zIndex: 10,
              }}
              aria-label="Cerrar ayuda"
              title="Cerrar"
            >
              ×
            </button>
            {/* Explicación para PC o móvil según isTouch */}
            {isTouch ? (
              <div className="modal-help-content modal-help-movil" style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
                <h2 style={{ color: '#259a57', marginTop: 0, marginBottom: 16, fontSize: 20, textAlign: 'center', width: '100%' }}>¿Cómo funciona la malla?</h2>
                <ul style={{ paddingLeft: 18, marginBottom: 18 }}>
                  <li><b>Toque simple</b> en una asignatura desbloqueada: la marcas como <b>aprobada</b> (verde).</li>
                  <li><b>Toque simple</b> en una asignatura verde: la desmarcas como aprobada.</li>
                  <li><b>Pulsación larga (1.2s)</b> en una asignatura desbloqueada: la marcas como <b>en curso</b> (amarillo).</li>
                  <li><b>Toque simple</b> en una asignatura amarilla: la quitas de "en curso".</li>
                  <li>Las asignaturas en naranja claro no pueden ser seleccionadas porque tienen prerrequisitos "en curso".</li>
                  <li>Las asignaturas grises están bloqueadas por prerrequisitos no cumplidos.</li>
                </ul>
                <div style={{ marginBottom: 10 }}>
                  <b>Colores:</b>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#38b36b', borderRadius: 4, marginRight: 8, border: '1.5px solid #259a57', verticalAlign: 'middle' }}></span> Aprobada</span>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#ffe066', borderRadius: 4, marginRight: 8, border: '1.5px solid #e6c200', verticalAlign: 'middle' }}></span> En curso</span>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#ffd8b0', borderRadius: 4, marginRight: 8, border: '1.5px solid #e6a259', verticalAlign: 'middle' }}></span> Prerrequisito en curso</span>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#f5f5f5', borderRadius: 4, marginRight: 8, border: '1.5px solid #bbb', verticalAlign: 'middle' }}></span> Bloqueada</span>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#fff', borderRadius: 4, marginRight: 8, border: '1.5px solid #bbb', verticalAlign: 'middle' }}></span> Disponible</span>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: '#888', marginTop: 18, textAlign: 'center', width: '100%' }}>
                  Puedes cerrar esta ayuda tocando fuera del recuadro o en la <b>×</b>.
                </div>
              </div>
            ) : (
              <div className="modal-help-content modal-help-pc" style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
                <h2 style={{ color: '#259a57', marginTop: 0, marginBottom: 16, fontSize: 22, textAlign: 'center', width: '100%' }}>¿Cómo funciona la malla?</h2>
                <div className="modal-help-columns" style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ul style={{ paddingLeft: 18, marginBottom: 18 }}>
                      <li><b>Click izquierdo</b> en una asignatura desbloqueada: la marcas como <b>aprobada</b> (verde).</li>
                      <li><b>Click izquierdo</b> en una asignatura verde: la desmarcas como aprobada.</li>
                      <li><b>Click derecho</b> en una asignatura desbloqueada: la marcas como <b>en curso</b> (amarillo).</li>
                      <li><b>Click izquierdo</b> en una asignatura amarilla: la quitas de "en curso".</li>
                      <li>Las asignaturas en naranja claro no pueden ser seleccionadas porque tienen prerrequisitos "en curso".</li>
                      <li>Las asignaturas grises están bloqueadas por prerrequisitos no cumplidos.</li>
                    </ul>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingLeft: 24, borderLeft: '1.5px solid #e6f9e6', display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
                    <b style={{ marginBottom: 8 }}>Colores:</b>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#38b36b', borderRadius: 4, marginRight: 8, border: '1.5px solid #259a57', verticalAlign: 'middle' }}></span> Aprobada</span>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#ffe066', borderRadius: 4, marginRight: 8, border: '1.5px solid #e6c200', verticalAlign: 'middle' }}></span> En curso</span>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#ffd8b0', borderRadius: 4, marginRight: 8, border: '1.5px solid #e6a259', verticalAlign: 'middle' }}></span> Prerrequisito en curso</span>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#f5f5f5', borderRadius: 4, marginRight: 8, border: '1.5px solid #bbb', verticalAlign: 'middle' }}></span> Bloqueada</span>
                    <span><span style={{ display: 'inline-block', width: 18, height: 18, background: '#fff', borderRadius: 4, marginRight: 8, border: '1.5px solid #bbb', verticalAlign: 'middle' }}></span> Disponible</span>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: '#888', marginTop: 18, textAlign: 'center', width: '100%' }}>
                  Puedes cerrar esta ayuda haciendo click fuera del recuadro o en la <b>×</b>.
                </div>
              </div>
            )}
            <style>{`
              @media (min-width: 700px) {
                .modal-help-columns {
                  flex-direction: row !important;
                  gap: 32px !important;
                  align-items: flex-start !important;
                  justify-content: center !important;
                }
                .modal-help-columns > div {
                  min-width: 0;
                }
              }
              @media (max-width: 699px) {
                .modal-ayuda {
                  max-width: 98vw !important;
                  min-width: 0 !important;
                  padding: 18px 6px !important;
                  border-radius: 12px !important;
                  font-size: 15px !important;
                  max-height: 90vh !important;
                  overflow-y: auto !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
      {/* Label flotante de créditos en curso solo en móvil */}
      {creditosEnCurso > 0 && (
        <div className="creditos-flotante-movil"
          style={{
            display: 'none', // por defecto oculto, visible solo en móvil por CSS
            position: 'fixed',
            left: 16,
            bottom: 24,
            zIndex: 1001,
            background: '#ffe066',
            color: '#8a6d1b',
            padding: '10px 22px',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 16,
            boxShadow: '0 2px 8px #ffe06655',
            minWidth: 140,
            textAlign: 'center',
            border: '2px solid #e6c200',
          }}
        >
          Créditos en curso: {creditosEnCurso}
        </div>
      )}
      <style>{`
        @media (max-width: 700px) {
          .malla-semestres {
            flex-direction: column !important;
            gap: 18px !important;
            overflow-x: unset !important;
            max-width: 100vw !important;
            padding-bottom: 0 !important;
          }
          .malla-semestre-columna {
            min-width: unset !important;
            max-width: unset !important;
            width: 100% !important;
            margin: 0 auto !important;
          }
          .creditos-flotante-movil {
            display: block !important;
          }
          .creditos-label-superior {
            display: none !important;
          }
        }
        @media (min-width: 701px) {
          .creditos-flotante-movil {
            display: none !important;
          }
          .creditos-label-superior {
            display: block !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap' }}>
        <h1 style={{ textAlign: "center", color: "#259a57", marginBottom: 0, flex: 1, fontSize: 32 }}>
          {malla.carrera}
        </h1>
        {creditosEnCurso > 0 && (
          <div className="creditos-label-superior" style={{
            background: '#ffe066',
            color: '#8a6d1b',
            padding: '8px 18px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 16,
            marginLeft: 24,
            boxShadow: '0 2px 8px #ffe06655',
            minWidth: 160,
            textAlign: 'right',
            marginTop: 12
          }}>
            Créditos en curso: {creditosEnCurso}
          </div>
        )}
        <style>{`
          @media (max-width: 700px) {
            .titulo-label-stack {
              flex-direction: column !important;
              align-items: center !important;
              gap: 10px !important;
            }
            .titulo-label-stack h1 {
              font-size: 22px !important;
              text-align: center !important;
            }
            .titulo-label-stack .creditos-label {
              font-size: 15px !important;
              min-width: unset !important;
              margin-left: 0 !important;
              text-align: center !important;
            }
          }
        `}</style>
      </div>
      <div
        className="malla-semestres"
        style={{
          display: "flex",
          gap: 24,
          justifyContent: "flex-start",
          alignItems: "flex-start",
          overflowX: "auto",
          paddingBottom: 16,
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
          maxWidth: "100vw"
        }}
      >
        {semestresContinuos.map((sem, idx) => {
          // Determinar si todas las asignaturas desbloqueadas del semestre están aprobadas
          const desbloqueadas = sem.asignaturas.filter(isDesbloqueada || (() => true));
          const codigosDesbloqueados = desbloqueadas.map((a) => a.codigo);
          const todasAprobadas = codigosDesbloqueados.length > 0 && codigosDesbloqueados.every((codigo) => aprobadas.includes(codigo));
          // Nueva lógica: el botón solo está habilitado si todas las asignaturas del semestre están desbloqueadas
          const todasDesbloqueadas = sem.asignaturas.every(isDesbloqueada || (() => true));
          return (
            <div
              className="malla-semestre-columna"
              key={`semestre-${sem.semestreContinuo}-${idx}`}
              style={{
                background: verdeScale[idx % verdeScale.length],
                borderRadius: 18,
                boxShadow: `0 2px 8px ${verdeScale[Math.min(idx + 2, verdeScale.length - 1)]}55`,
                padding: 18,
                minWidth: 220,
                maxWidth: 260,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: "0 0 220px"
              }}
            >
              {onTacharSemestre && (
                <button
                  onClick={() => todasDesbloqueadas && onTacharSemestre(sem.asignaturas)}
                  disabled={!todasDesbloqueadas}
                  style={{
                    marginBottom: 10,
                    background: todasAprobadas && todasDesbloqueadas ? "#38b36b" : "#c2f0cb",
                    color: todasAprobadas && todasDesbloqueadas ? "#fff" : "#205c36",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: todasDesbloqueadas ? "pointer" : "not-allowed",
                    boxShadow: todasAprobadas && todasDesbloqueadas ? "0 0 0 2px #259a57" : "none",
                    transition: "all 0.2s",
                    opacity: todasDesbloqueadas ? 1 : 0.5
                  }}
                  title={
                    todasDesbloqueadas
                      ? (todasAprobadas ? "Destachar todas las asignaturas del semestre" : "Tachar todas las asignaturas desbloqueadas del semestre")
                      : "No puedes tachar el semestre hasta que todas las asignaturas estén desbloqueadas"
                  }
                >
                  {todasAprobadas ? "Semestre completado" : "Completar semestre"}
                </button>
              )}
              <h2 style={{ color: textColorForBg(idx), marginBottom: 16, fontSize: 22 }}>Semestre {sem.semestreContinuo}</h2>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
                {sem.asignaturas.map((asig) => {
                  const estaAprobada = aprobadas.includes(asig.codigo);
                  const desbloqueada = isDesbloqueada ? isDesbloqueada(asig) : true;
                  const estaEnCurso = enCurso && enCurso.includes(asig.codigo);
                  // Nuevo: ¿todos los prerrequisitos están aprobados o en curso, y al menos uno en curso?
                  const todosPrereqAprobOEnCurso = asig.prerrequisitos.length > 0 && asig.prerrequisitos.every((pr: string) => (aprobadas.includes(pr) || (enCurso && enCurso.includes(pr))));
                  const algunoPrereqEnCurso = asig.prerrequisitos.some((pr: string) => enCurso && enCurso.includes(pr));
                  const mostrarNaranja = todosPrereqAprobOEnCurso && algunoPrereqEnCurso;
                  // Color de texto: si está aprobada, blanco; si no, siempre oscuro
                  const colorTexto = estaAprobada ? "#fff" : "#205c36";

                  // Long press logic
                  let longPressTimer: NodeJS.Timeout | null = null;
                  const longPressDuration = 1200; // ms (1.2 segundos)

                  const handleTouchStart = (e: React.TouchEvent) => {
                    if (!onAsignaturaCursoClick) return;
                    // Solo permite long press si está desbloqueada y NO está aprobada y no tiene prereq en curso
                    if (!desbloqueada || estaAprobada || mostrarNaranja) return;
                    longPressTimer = setTimeout(() => {
                      onAsignaturaCursoClick(asig);
                    }, longPressDuration);
                  };
                  const handleTouchEnd = (e: React.TouchEvent) => {
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      longPressTimer = null;
                    }
                  };

                  // Nuevo: si tiene prereq en curso y todos los demás aprobados/en curso, no es cliqueable
                  const esCliqueable = (desbloqueada && !mostrarNaranja && !estaAprobada) || estaAprobada;

                  return (
                    <div
                      key={asig.codigo}
                      style={{
                        border: `1.5px solid ${verdeScale[Math.min(idx + 2, verdeScale.length - 1)]}`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        background: estaAprobada
                          ? "#38b36b"
                          : estaEnCurso
                          ? "#ffe066"
                          : mostrarNaranja
                          ? "#ffd8b0" // naranja claro
                          : desbloqueada
                          ? "#fff"
                          : "#f5f5f5",
                        opacity: esCliqueable ? 1 : 0.7,
                        textDecoration: estaAprobada ? "line-through" : "none",
                        color: desbloqueada ? colorTexto : "#888",
                        fontWeight: 500,
                        fontSize: 16,
                        marginBottom: 2,
                        cursor: esCliqueable ? "pointer" : "not-allowed",
                        boxShadow: estaAprobada ? "0 0 0 2px #259a57" : "none",
                        transition: "all 0.2s"
                      }}
                      onClick={() => esCliqueable && onAsignaturaClick && onAsignaturaClick(asig)}
                      onContextMenu={e => {
                        if (!esCliqueable) return;
                        e.preventDefault();
                        if (onAsignaturaCursoClick) {
                          onAsignaturaCursoClick(asig);
                        }
                      }}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                    >
                      <div style={{ fontWeight: 600 }}>{asig.nombre}</div>
                      <div style={{ fontSize: 12, color: estaAprobada ? "#fff" : "#259a57", marginTop: 2 }}>{asig.codigo} · {asig.creditos} créditos</div>
                      {/* Aquí podrías mostrar más info */}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{textAlign: "center", color: "#259a57", marginTop: 18, fontSize: 15}}>
        <span>Desliza horizontalmente para ver todos los semestres</span>
      </div>
    </div>
  );
};

export default MallaGrid; 