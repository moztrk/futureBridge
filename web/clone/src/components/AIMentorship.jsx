import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AIMentorship.css";
import { Handle, Position } from "reactflow";
import SimpleRoadmap from "./SimpleRoadmap";
import HorizontalRoadmap from "./HorizontalRoadmap";
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import * as d3 from 'd3';
import { zoomIdentity } from 'd3';
import dagre from 'dagre';



const API_BASE_URL = 'http://localhost:8000/api';

const isCritical = (text) => /dikkat|önemli|kritik|uyarı|risk/i.test(text);

// --- Yol Haritası API Fonksiyonları ---
const fetchRoadmaps = async (token) => {
  const res = await fetch(`${API_BASE_URL}/roadmap/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

const saveRoadmap = async (token, title, steps) => {
  const res = await fetch(`${API_BASE_URL}/roadmap/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ title, steps })
  });
  return res.json();
};

const deleteRoadmap = async (token, roadmapId) => {
  const res = await fetch(`${API_BASE_URL}/roadmap/${roadmapId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.ok;
};

const fetchRoadmapDetail = async (token, roadmapId) => {
  const res = await fetch(`${API_BASE_URL}/roadmap/${roadmapId}/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

// --- Modern CSS Grid tabanlı Yol Haritası Componenti ---
const ICON_STAR = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" fill="#fbbf24"/></svg>
);
const ICON_TICK = (
  <svg width="22" height="22" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" fill="#4ade80" stroke="#22c55e" strokeWidth="2"/><path d="M8 15l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

function getKeyword(text) {
  // Önce başlık gibi bir kelime var mı bak (örn. büyük harfle başlayan, teknik terim)
  const match = text.match(/([A-ZÇŞĞÜÖİ][\wÇŞĞÜÖİçşğüöı]+)/);
  if (match) return match[1];
  // Yoksa ilk 2-3 kelimeyi al
  return text.split(' ').slice(0, 2).join(' ');
}

// --- Tree veri yapısı örneği (id, text, parent, is_critical, completed) ---
// Bunu backend'den almak veya AI'dan parse etmek ideal, şimdilik örnek veriyle gösteriyorum.
const exampleTreeSteps = [
  { id: '1', text: 'Makine Öğrenmesi', parent: null, is_critical: true, completed: false },
  { id: '2', text: 'Veri Ön İşleme', parent: '1', is_critical: false, completed: false },
  { id: '3', text: 'Temel Matematik', parent: '1', is_critical: true, completed: false },
  { id: '4', text: 'Toplama', parent: '3', is_critical: false, completed: false },
  { id: '5', text: 'Çıkarma', parent: '3', is_critical: false, completed: false },
];

// Adım tipini belirleyen fonksiyon
function getStepType(text, idx, total) {
  const t = text.toLowerCase();
  if (idx === 0) return 'Başlangıç';
  if (idx === total - 1) return 'Son';
  if (/kritik|kırılma|break|turning|milestone|risk|uyarı/.test(t)) return 'Kritik Nokta';
  if (/önemli|dikkat|major|important/.test(t)) return 'Önemli Aşama';
  return 'Aşama';
}

// AI metnini dallanan ağaç yapısına çeviren fonksiyon (geliştirilmiş)
function parseTextToTreeSteps(aiText) {
  const lines = aiText.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];
  const steps = [];
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[^\w\s])/, '').trim();
    const type = getStepType(text, i, lines.length);
    steps.push({
      id: String(i + 1),
      text,
      parent: i === 0 ? null : String(i), // zincir gibi bağla (daha iyi ağaç için daha gelişmiş algoritma eklenebilir)
      is_critical: type === 'Kritik Nokta',
      completed: false,
      type,
      desc: text // açıklama olarak aynı metni kullanıyoruz, istersen farklı parse edebilirsin
    });
  }
  // Parent düzelt: ilk adımın parent'ı null, diğerleri bir önceki adım
  steps[0].parent = null;
  return steps;
}

// DAGRE LAYOUT
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 220;
const nodeHeight = 70;

function treeStepsToFlow(treeSteps) {
  // Dagre node ve edge ekle
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 60 });
  treeSteps.forEach((step, idx) => {
    dagreGraph.setNode(step.id, { width: nodeWidth, height: nodeHeight });
  });
  treeSteps.forEach(step => {
    if (step.parent) dagreGraph.setEdge(step.parent, step.id);
  });
  dagre.layout(dagreGraph);

  const nodes = treeSteps.map(step => {
    const nodeWithPos = dagreGraph.node(step.id);
    return {
      id: step.id,
      data: {
        label: step.type,
        fullText: step.text,
        desc: step.desc,
        isCritical: step.is_critical,
        completed: step.completed,
        type: step.type
      },
      position: { x: nodeWithPos.x - nodeWidth / 2, y: nodeWithPos.y - nodeHeight / 2 },
      type: 'customNode',
    };
  });
  const edges = treeSteps.filter(s => s.parent).map(step => ({
    id: `e${step.parent}-${step.id}`,
    source: step.parent,
    target: step.id,
    animated: step.is_critical,
    style: {
      stroke: step.is_critical ? '#e11d48' : step.type === 'Önemli Aşama' ? '#fbbf24' : '#2563eb',
      strokeWidth: step.is_critical ? 3.5 : 2.2
    },
    markerEnd: { type: 'arrowclosed', color: step.is_critical ? '#e11d48' : step.type === 'Önemli Aşama' ? '#fbbf24' : '#2563eb' },
  }));
  return { nodes, edges };
}

// Custom node component (tooltip ve tip etiketi ile)
const nodeTypes = {
  customNode: ({ data }) => (
    <div
      className="custom-node"
      style={{
        background: data.type === 'Başlangıç' ? 'linear-gradient(90deg,#2563eb,#60a5fa)' :
                    data.type === 'Kritik Nokta' ? 'linear-gradient(90deg,#e11d48,#fb7185)' :
                    data.type === 'Önemli Aşama' ? 'linear-gradient(90deg,#fbbf24,#fde68a)' :
                    data.type === 'Son' ? 'linear-gradient(90deg,#22c55e,#4ade80)' :
                    'linear-gradient(90deg,#2563eb,#1e40af)',
        color: '#fff',
        borderRadius: 14,
        border: data.type === 'Kritik Nokta' ? '2.5px solid #e11d48' : data.type === 'Önemli Aşama' ? '2.5px solid #fbbf24' : data.type === 'Son' ? '2.5px solid #22c55e' : '2px solid #2563eb',
        minWidth: 120,
        minHeight: 48,
        padding: '12px 18px',
        fontWeight: 600,
        fontSize: 16,
        boxShadow: '0 2px 12px #0001',
        position: 'relative',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'box-shadow 0.2s',
      }}
      title={data.desc}
    >
      <div style={{fontSize: 13, fontWeight: 700, marginBottom: 2, letterSpacing: 0.2}}>{data.label}</div>
      <div style={{fontSize: 15, fontWeight: 500}}>{data.fullText}</div>
      {/* Tooltip hover için title kullanıldı, istersen özel tooltip ekleyebilirsin */}
    </div>
  )
};

// RoadmapTree bileşenini güncelle
const RoadmapTree = ({ treeSteps }) => {
  const { nodes, edges } = treeStepsToFlow(treeSteps);
  return (
    <div style={{ width: '100%', height: 420, background: 'transparent', borderRadius: 18, margin: '32px 0' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
      >
        <MiniMap nodeColor={n => n.style?.background || '#2563eb'} />
        <Controls />
        <Background color="#e5e7eb" gap={24} />
      </ReactFlow>
    </div>
  );
};

// --- Kart tabanlı Accordion Tree ---
function AccordionCardTree({ steps }) {
  // id -> step map
  const idMap = Object.fromEntries(steps.map(s => [s.id, s]));
  // parent=null olan kökleri bul
  const roots = steps.filter(s => !s.parent);
  // children'ı bul
  function getChildren(parentId) {
    return steps.filter(s => s.parent === parentId);
  }
  // Accordion state
  const [openIds, setOpenIds] = useState([]);
  function toggle(id) {
    setOpenIds(open => open.includes(id) ? open.filter(i => i !== id) : [...open, id]);
  }
  function renderCard(step, depth = 0) {
    const isCritical = step.is_critical;
    const isCompleted = step.completed;
    const children = getChildren(step.id);
    let border = isCompleted ? '#22c55e' : isCritical ? '#fbbf24' : '#2563eb';
    let bg = isCompleted ? 'linear-gradient(90deg,#22c55e,#4ade80)' : isCritical ? 'linear-gradient(90deg,#f43f5e,#fbbf24)' : 'linear-gradient(90deg,#2563eb,#1e40af)';
    return (
      <div key={step.id} style={{
        marginLeft: depth * 18,
        marginBottom: 16,
        border: `2px solid ${border}`,
        borderRadius: 16,
        background: bg,
        color: '#fff',
        boxShadow: '0 2px 12px #0001',
        padding: 18,
        position: 'relative',
        cursor: children.length > 0 ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
        minWidth: 220,
        maxWidth: 520,
      }} onClick={() => children.length > 0 && toggle(step.id)}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {isCritical && <span style={{fontSize:22}}>⚠️</span>}
          {isCompleted && <span style={{fontSize:22}}>✔️</span>}
          <span style={{fontWeight:700,fontSize:18}}>{getKeyword(step.text)}</span>
          {children.length > 0 && <span style={{marginLeft:'auto',fontSize:18,transform:openIds.includes(step.id)?'rotate(90deg)':'rotate(0deg)',transition:'transform 0.2s'}}>▶</span>}
        </div>
        <div style={{fontSize:15,opacity:0.95,marginTop:6}}>{step.text}</div>
        {children.length > 0 && openIds.includes(step.id) && (
          <div style={{marginTop:12}}>
            {children.map(child => renderCard(child, depth+1))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{width:'100%',maxWidth:540,margin:'0 auto',padding:8}}>
      {roots.map(root => renderCard(root))}
    </div>
  );
}

// --- Yol haritası paylaşma ve silme fonksiyonları ---
async function shareRoadmapAsPost(token, roadmap) {
  if (!roadmap.steps) {
    alert('Yol haritası adımları bulunamadı!');
    return;
  }
  const res = await fetch(`${API_BASE_URL}/posts/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ content: `Yol Haritası: ${roadmap.title}\n\n${roadmap.steps.map(s => s.text).join('\n')}` })
  });
  return res.json();
}

// RoadmapSkeleton loading component
const RoadmapSkeleton = () => (
  <div className="roadmap-skeleton">
    <div className="skeleton-header"></div>
    <div className="skeleton-content"></div>
    <div className="skeleton-actions"></div>
  </div>
);

// Sabit başlıklar ve ikonlar (dinamik için default ikonlar da ekle)
const stepTitles = [
  { title: 'Giriş', icon: '🚀' },
  { title: 'Temel Plan', icon: '📝' },
  { title: 'Hazırlık', icon: '🧰' },
  { title: 'Uygulama', icon: '⚙️' },
  { title: 'Kritik Nokta', icon: '⚡' },
  { title: 'İlerleme', icon: '📈' },
  { title: 'Değerlendirme', icon: '🔍' },
  { title: 'Sonuç', icon: '🏁' },
  { title: 'Final', icon: '🎉' },
];
const defaultIcons = ['⬜', '🟦', '🟩', '🟨', '🟧', '🟥', '🟪', '🟫', '⬛', '➕', '➖', '⭐'];

// AI önerisini kartlara bölen component
function AISuggestionCards({ steps, completed, onToggle, onSave, saving }) {
  return (
    <div style={{width:'100%',maxWidth:520,margin:'0 auto',marginTop:18,marginBottom:18}}>
      {steps.map((step, idx) => {
        const titleObj = stepTitles[idx] || { title: `Ekstra Adım ${idx+1}`, icon: defaultIcons[idx % defaultIcons.length] };
        return (
          <div key={step.id || idx} className={`ai-roadmap-card fade-in${completed[idx] ? ' completed' : ''}`} style={{
            background:'#fff',
            border: completed[idx] ? '2.5px solid #22c55e' : '2px solid #2563eb',
            borderRadius:18,
            boxShadow:'0 4px 24px #2563eb22',
            padding:'22px 22px 16px 22px',
            marginBottom:20,
            display:'flex',
            alignItems:'flex-start',
            gap:18,
            position:'relative',
            minHeight:80,
            transition:'box-shadow 0.25s, border 0.22s, transform 0.18s',
            animationDelay: `${idx*0.07}s`,
            animationDuration: '0.7s',
            animationFillMode: 'backwards',
          }}>
            <button onClick={()=>onToggle(idx)} className={`ai-tick-btn${completed[idx] ? ' ticked' : ''}`} style={{
              width:38,height:38,borderRadius:'50%',border:'2.5px solid #22c55e',background:completed[idx]?'#22c55e':'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,cursor:'pointer',marginRight:8,marginTop:2,transition:'background 0.18s, transform 0.18s',color:completed[idx]?'#fff':'#22c55e',outline:'none',boxShadow:'0 1px 6px #22c55e22',
              animation: completed[idx] ? 'tick-bounce 0.32s' : undefined
            }} title={completed[idx]?'Tamamlandı':'Tamamlandı olarak işaretle'}>
              {completed[idx] ? '✔️' : ''}
            </button>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
                <span style={{fontSize:32,filter:'drop-shadow(0 2px 6px #2563eb22)'}}>{titleObj.icon}</span>
                <span style={{fontWeight:800,fontSize:22,color:'#2563eb',letterSpacing:0.2}}>{titleObj.title}</span>
              </div>
              <div style={{fontSize:16.5,marginTop:4,color:'#222',opacity:0.97,lineHeight:1.45}}>{step.text}</div>
            </div>
          </div>
        );
      })}
      <button onClick={onSave} disabled={saving} className="ai-save-btn-anim" style={{width:'100%',marginTop:10,background:'linear-gradient(90deg,#2563eb,#60a5fa)',color:'#fff',border:'none',borderRadius:12,padding:'15px 0',fontWeight:800,fontSize:19,cursor:'pointer',boxShadow:'0 2px 12px #2563eb22',transition:'background 0.2s, transform 0.18s'}}>
        {saving ? 'Kaydediliyor...' : 'Yol Haritası Olarak Kaydet'}
      </button>
    </div>
  );
}

// Yol haritalarımda yüzde tamamlanma göster
function RoadmapList({ roadmaps, onShare, onDelete, onShowTree }) {
  if (!roadmaps || roadmaps.length === 0) {
    return (
      <div className="empty-roadmaps-state">
        <div className="empty-icon">🗺️</div>
        <h3>Henüz Yol Haritanız Yok</h3>
        <p>AI önerisi alıp ilk yol haritanızı oluşturun</p>
      </div>
    );
  }
  return (
    <div className="roadmap-list" style={{display:'flex',flexWrap:'wrap',gap:18}}>
      {roadmaps.map((rm, idx) => {
        let steps = [];
        if (Array.isArray(rm.steps)) steps = rm.steps;
        else if (typeof rm.steps === 'string') {
          try { steps = JSON.parse(rm.steps); } catch { steps = []; }
        }
        const completedCount = steps.filter(s => s.completed).length;
        const percent = steps.length ? Math.round((completedCount/steps.length)*100) : 0;
        return (
          <div className="roadmap-card" key={rm.id || idx} style={{background:'#fff',border:'1.5px solid #e5e7eb',borderRadius:14,boxShadow:'0 2px 8px #0001',padding:18,minWidth:220,maxWidth:340,display:'flex',flexDirection:'column',gap:10}}>
            <span className="roadmap-list-title" style={{fontWeight:700,fontSize:18,color:'#2563eb'}}>{rm.title || 'Yol Haritası'}</span>
            <div style={{fontSize:14.5,color:'#16a34a',fontWeight:600,marginBottom:2}}>
              Tamamlanma: %{percent}
            </div>
            <div style={{display: 'flex', gap: 10, marginTop: 8}}>
              <button onClick={() => onShowTree(rm)} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontWeight:600,cursor:'pointer'}}>Detay</button>
              <button onClick={() => onShare(rm)} style={{background:'#fbbf24',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontWeight:600,cursor:'pointer'}}>Paylaş</button>
              <button onClick={() => onDelete(rm)} style={{background:'#f43f5e',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontWeight:600,cursor:'pointer'}}>Sil</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Backend'e adım tamamlanma güncelleme fonksiyonu (yeni)
async function patchRoadmapStep(userToken, roadmapId, steps) {
  await fetch(`${API_BASE_URL}/roadmap/${roadmapId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ steps }),
  });
}

export default function AIMentorship({ userToken }) {
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiSteps, setAiSteps] = useState([]); // parse edilmiş adımlar
  const [aiCompleted, setAiCompleted] = useState([]); // öneri kartı için tikler
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [isSharingPost, setIsSharingPost] = useState(false);
  // Yol Haritalarım için
  const [roadmaps, setRoadmaps] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null); // Detay modalı için
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailSteps, setDetailSteps] = useState([]);
  const [detailCompleted, setDetailCompleted] = useState([]); // detay modalı için tikler
  const aiCardsRef = useRef(null); // AI öneri kartları için ref

  // Yol haritalarımı çek
  useEffect(() => {
    if (!userToken) return;
    setLoadingRoadmaps(true);
    fetchRoadmaps(userToken)
      .then(data => setRoadmaps(Array.isArray(data) ? data : []))
      .catch(() => setRoadmaps([]))
      .finally(() => setLoadingRoadmaps(false));
  }, [userToken]);

  // AI'dan gelen öneriyi parse et
  useEffect(() => {
    if (!aiSuggestion) { setAiSteps([]); setAiCompleted([]); return; }
    let steps = parseTextToTreeSteps(aiSuggestion);
    setAiSteps(steps);
    setAiCompleted(Array(steps.length).fill(false));
  }, [aiSuggestion]);

  // AI öneri kartları çıktığında otomatik scroll
  useEffect(() => {
    if (aiSteps.length > 0 && aiCardsRef.current) {
      aiCardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [aiSteps]);

  // Yol haritası detayını aç
  const handleShowTree = async (roadmap) => {
    setSelectedRoadmap(roadmap);
    setShowDetailModal(true);
    // Yol haritası adımlarını parse et
    let steps = [];
    if (roadmap.steps && Array.isArray(roadmap.steps)) {
      steps = roadmap.steps;
    } else if (typeof roadmap.steps === 'string') {
      try { steps = JSON.parse(roadmap.steps); } catch { steps = []; }
    }
    setDetailSteps(steps);
    setDetailCompleted(steps.map(s => !!s.completed));
  };

  // Yol haritası kaydet
  const handleSaveRoadmap = async () => {
    if (!aiSteps.length) return;
    setSavingRoadmap(true);
    // Adımların tamamlanma durumunu da kaydet
    const stepsToSave = aiSteps.map((s, i) => ({...s, completed: aiCompleted[i]}));
    const title = window.prompt('Yol haritası başlığı girin:', 'AI Yol Haritası') || 'AI Yol Haritası';
    await saveRoadmap(userToken, title, stepsToSave);
    // Yol haritalarını tekrar çek
    fetchRoadmaps(userToken).then(data => setRoadmaps(Array.isArray(data) ? data : []));
    setSavingRoadmap(false);
    setAiSuggestion("");
    setAiSteps([]);
    setAiCompleted([]);
  };

  // Sadece backend'den öneri al
  const handleGetSuggestion = async () => {
    if (!userInput.trim()) {
      setError("Lütfen kariyer hedeflerinizi veya durumunuzu yazın.");
      return;
    }
    if (!userToken) {
      setError("Kimlik doğrulama token'ı bulunamadı. Lütfen giriş yapın.");
      return;
    }
    setLoading(true);
    setError("");
    setAiSuggestion(""); // Sadece suggestion sıfırlanır, aiSteps ve aiCompleted sıfırlanmaz!
    try {
      const response = await fetch(`http://localhost:8000/api/ai-suggestion/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ user_input: userInput }),
      });
      if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage = errorBody.detail || JSON.stringify(errorBody) || `API isteği başarısız oldu: ${response.status}`;
        setError(errorMessage);
        return;
      }
      const responseData = await response.json();
      const suggestionText = responseData?.suggestion_text;
      if (suggestionText) {
        setAiSuggestion(suggestionText);
        // Sadece burada yeni adımlar parse edilecek!
      } else {
        setError("AI'dan öneri alınamadı veya boş yanıt döndü. Lütfen tekrar deneyin.");
      }
    } catch (err) {
      setError(`Öneri alınırken bir hata oluştu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Detay modalında adım tiklerini güncelle (backend'e de kaydet)
  const handleDetailToggle = (idx) => {
    setDetailCompleted(arr => {
      const copy = [...arr];
      copy[idx] = !copy[idx];
      setDetailSteps(steps => steps.map((s, i) => i === idx ? {...s, completed: copy[idx]} : s));
      // Backend'e PATCH isteği at
      if (detailSteps[idx] && detailSteps[idx].id) {
        patchRoadmapStep(userToken, selectedRoadmap.id, detailSteps);
      }
      return copy;
    });
  };

  // Yol haritası paylaş
  const handleShareRoadmap = async (roadmap) => {
    await shareRoadmapAsPost(userToken, roadmap);
    alert('Yol haritası gönderi olarak paylaşıldı!');
  };

  // Yol haritası sil
  const handleDeleteRoadmap = async (roadmap) => {
    if (!window.confirm('Bu yol haritasını silmek istediğinize emin misiniz?')) return;
    await deleteRoadmap(userToken, roadmap.id);
    setRoadmaps(rms => rms.filter(r => r.id !== roadmap.id));
  };

  // AI önerisi kartlarında tiklenince tamamlanma oranı güncellensin
  const handleAiToggle = (idx) => {
    setAiCompleted(arr => {
      const copy = [...arr];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  return (
    <div className="mentorship-container">
      <div className="mentorship-header">
        <h1>AI Mentorluk Paneli</h1>
        <p>Kariyer hedeflerinize göre kişiselleştirilmiş yol haritaları oluşturun.</p>
      </div>

      {/* Yol Haritalarım Bölümü */}
      <div style={{marginBottom: 32}}>
        <h2 style={{fontSize: '1.3em', marginBottom: 12}}>Yol Haritalarım</h2>
        {loadingRoadmaps ? (
          <div>Yol haritaları yükleniyor...</div>
        ) : (
          <RoadmapList
            roadmaps={roadmaps}
            onShare={handleShareRoadmap}
            onDelete={handleDeleteRoadmap}
            onShowTree={handleShowTree}
          />
        )}
      </div>

      {/* Yol haritası detay modalı - KENDİ MODALIMIZ */}
      {showDetailModal && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.32)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2vw',
        }}
          onClick={() => setShowDetailModal(false)}
        >
          <div style={{
            background: '#fff', borderRadius: 18, maxWidth: 1100, width: '98vw', maxHeight: '92vh', minHeight: 400,
            overflowY: 'auto', padding: 38, outline: 'none', boxShadow: '0 4px 32px #0002', position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowDetailModal(false)} style={{position: 'absolute', right: 22, top: 18, background: '#f43f5e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 18}}>Kapat ✕</button>
            <h2 style={{marginBottom: 18, fontSize: '1.5em', color: '#2563eb', textAlign: 'center'}}>{selectedRoadmap?.title || 'AI Yol Haritası'}</h2>
            <div style={{width: '100%', minHeight: 350}}>
              {/* Detayda kartlar ve tikler */}
              {detailSteps.map((step, idx) => {
                const titleObj = stepTitles[idx] || { title: `Ekstra Adım ${idx+1}`, icon: defaultIcons[idx % defaultIcons.length] };
                return (
                  <div key={step.id || idx} style={{
                    background:'#fff',
                    border: detailCompleted[idx] ? '2.5px solid #22c55e' : '2px solid #2563eb',
                    borderRadius:16,
                    boxShadow:'0 2px 12px #0001',
                    padding:'18px 18px 14px 18px',
                    marginBottom:16,
                    display:'flex',
                    alignItems:'flex-start',
                    gap:16,
                    position:'relative',
                    minHeight:70,
                    transition:'box-shadow 0.18s',
                  }}>
                    <button onClick={()=>handleDetailToggle(idx)} style={{
                      width:32,height:32,borderRadius:'50%',border:'2px solid #22c55e',background:detailCompleted[idx]?'#22c55e':'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,cursor:'pointer',marginRight:6,marginTop:2,transition:'background 0.18s',color:detailCompleted[idx]?'#fff':'#22c55e',outline:'none',boxShadow:'0 1px 4px #0001',
                    }} title={detailCompleted[idx]?'Tamamlandı':'Tamamlandı olarak işaretle'}>
                      {detailCompleted[idx] ? '✔️' : ''}
                    </button>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                        <span style={{fontSize:22}}>{titleObj.icon}</span>
                        <span style={{fontWeight:700,fontSize:17}}>{titleObj.title}</span>
                      </div>
                      <div style={{fontSize:15.5,marginTop:2,color:'#222',opacity:0.97}}>{step.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="ai-suggestion-panel">
        <h2>AI Kariyer Önerisi Alın</h2>
        <p>Kariyer hedeflerinizi, mevcut becerilerinizi veya öğrenmek istediğiniz konuları girin, AI size özel bir yol haritası sunsun.</p>
        <div className="ai-input-area">
          <textarea
            className="career-input-textarea"
            placeholder="Örn: Frontend geliştirici olmak istiyorum, mevcut becerilerim HTML, CSS, JS. Ne öğrenmeliyim? Veya: Veri bilimi alanında kariyer yapmak için hangi sertifikalar faydalı olur?"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows="6"
            disabled={loading}
          ></textarea>
          <button
            className="get-suggestion-button"
            onClick={handleGetSuggestion}
            disabled={loading || !userInput.trim()}
          >
            {loading ? 'Öneri Alınıyor...' : 'Öneri Al'}
          </button>
        </div>
        {error && <div className="suggestion-error">Hata: {error}</div>}
        {/* AI önerisi geldiyse kartlar */}
        {aiSteps.length > 0 && (
          <div ref={aiCardsRef}>
            <AISuggestionCards
              steps={aiSteps}
              completed={aiCompleted}
              onToggle={handleAiToggle}
              onSave={handleSaveRoadmap}
              saving={savingRoadmap}
            />
            {/* Tamamlanma oranı göster */}
            <div style={{textAlign:'center',fontWeight:600,color:'#16a34a',fontSize:16,marginTop:8}}>
              Tamamlanma: %{aiSteps.length ? Math.round((aiCompleted.filter(Boolean).length/aiSteps.length)*100) : 0}
            </div>
          </div>
        )}
      </div>
      <div className="mentorship-footer">
        <p>AI Mentorluk Paneli, kariyerinizi yönlendirecek bir yol haritası sunar.</p>
      </div>
    </div>
  );
}