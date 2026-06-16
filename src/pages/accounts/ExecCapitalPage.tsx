import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import { Bookmark, BookmarkCheck, Plus } from 'lucide-react'
import { ALL_EXECS, ACCOUNTS_LIST, REVANCE_ORG, TAKEDA_ORG } from '../../data'
import { getOrgChart, saveOrgChart } from '../../lib/supabase'
import type { OrgPerson } from '../../lib/supabase'

// ─── Constants ─────────────────────────────────────────────────────────────
const CARD_W = 260
const CARD_H = 96
const H_GAP  = 56
const V_GAP  = 80
const LEVEL_GAP_H = 100
const SPINE_ABOVE = 44

const REL: Record<string, { label:string; color:string; bg:string }> = {
  hot:  { label:'Hot',  color:'#e85d04', bg:'#fff3ed' },
  warm: { label:'Warm', color:'#b89428', bg:'#fdf8e8' },
  cold: { label:'Cold', color:'#1a4a8a', bg:'#edf2fb' },
}
const AVATAR_COLORS = ['#c62a2a','#1a4a8a','#5a3fa0','#a05a00','#0f7a6e','#b89428','#1B365D','#0f7a6e']

type Orientation = 'leftright' | 'topdown'
interface Pos { x: number; y: number }

// ─── Top-Down layout (from insightorg) ──────────────────────────────────────
interface VNode { id:string; x:number; y:number; subtreeW:number; children:VNode[] }

function layoutTopDown(id: string, people: OrgPerson[], depth: number, xOff: number): VNode {
  const children = people.filter(p => p.managerId === id)
  const y = SPINE_ABOVE + depth * (CARD_H + V_GAP)
  if (children.length === 0) return { id, x:xOff, y, subtreeW:CARD_W, children:[] }
  let cx = xOff
  const childNodes: VNode[] = []
  for (const c of children) {
    const n = layoutTopDown(c.id, people, depth+1, cx)
    childNodes.push(n); cx += n.subtreeW + H_GAP
  }
  const subtreeW = Math.max(CARD_W, cx - H_GAP - xOff)
  const firstCx  = childNodes[0].x + CARD_W/2
  const lastCx   = childNodes[childNodes.length-1].x + CARD_W/2
  const parentX  = (firstCx + lastCx)/2 - CARD_W/2
  return { id, x:parentX, y, subtreeW, children:childNodes }
}

function flattenVNode(n: VNode): VNode[] {
  return [n, ...n.children.flatMap(flattenVNode)]
}

// ─── Left-Right layout ──────────────────────────────────────────────────────
function layoutLeftRight(id: string, people: OrgPerson[], depth: number, yOff: number, posMap: Record<string,Pos>): { h:number; yCenter:number } {
  const children = people.filter(p => p.managerId === id)
  const x = SPINE_ABOVE + depth * (CARD_W + LEVEL_GAP_H)
  if (children.length === 0) { posMap[id] = { x, y:yOff }; return { h:CARD_H, yCenter:yOff+CARD_H/2 } }
  let cy = yOff; const centers: number[] = []
  for (const c of children) {
    const r = layoutLeftRight(c.id, people, depth+1, cy, posMap)
    centers.push(r.yCenter); cy += r.h + H_GAP
  }
  const totalH = cy - H_GAP - yOff
  const yCenter = (centers[0] + centers[centers.length-1])/2
  posMap[id] = { x, y: yCenter - CARD_H/2 }
  return { h:totalH, yCenter }
}

// ─── SVG Connectors ─────────────────────────────────────────────────────────
function ConnTopDown({ px,py,cx,cy }: { px:number;py:number;cx:number;cy:number }) {
  const x1=px+CARD_W/2, y1=py+CARD_H, x2=cx+CARD_W/2, y2=cy, my=(y1+y2)/2
  return <path d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} fill="none" stroke="var(--border-strong)" strokeWidth="2"/>
}

function ConnLeftRight({ px,py,cx,cy }: { px:number;py:number;cx:number;cy:number }) {
  const x1=px+CARD_W, y1=py+CARD_H/2, x2=cx, y2=cy+CARD_H/2, mx=(x1+x2)/2
  return <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke="var(--border-strong)" strokeWidth="2"/>
}

// ─── Org Card ───────────────────────────────────────────────────────────────
function ProperOrgCard({ person, isSelected, draggingId, editMode, onSelect, onEdit, onRemove, onDetach, x, y }: any) {
  const { setNodeRef:setDropRef, isOver } = useDroppable({ id:`drop-${person.id}`, data:{ personId:person.id }, disabled:!editMode })
  const { attributes, listeners, setNodeRef:setDragRef, isDragging } = useDraggable({ id:person.id, disabled:!editMode })
  const setRef = (el: HTMLDivElement|null) => { setDropRef(el); setDragRef(el) }

  const rel = REL[person.relationship] || REL.cold
  const idx = parseInt(person.id.replace(/\D/g,'')) || 0
  const av = AVATAR_COLORS[idx % AVATAR_COLORS.length]
  const initials = person.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)
  const hasManager = person.managerId !== null

  return (
    <div ref={setRef}
      style={{ position:'absolute', left:x, top:y, width:CARD_W, opacity:isDragging?0.08:1,
        transition:'left 0.38s cubic-bezier(0.4,0,0.2,1), top 0.38s cubic-bezier(0.4,0,0.2,1)',
        background:'var(--bg-surface)', border:isSelected?'2px solid var(--gold)':(isOver&&draggingId!==person.id)?'2px solid #10b981':'1.5px solid var(--border)',
        borderRadius:14, display:'flex', alignItems:'center', padding:'14px 16px 14px 14px',
        boxShadow:isSelected?'0 0 0 3px rgba(212,175,55,0.3)':(isOver&&draggingId!==person.id)?'0 0 0 3px rgba(16,185,129,0.2)':'var(--glow-card)',
        cursor:editMode?'grab':'default', overflow:'visible' }}
      onClick={(e:any)=>{ e.stopPropagation(); if(editMode) onSelect(person.id) }}>

      {editMode && (
        <div {...attributes} {...listeners} style={{ display:'flex',alignItems:'center',justifyContent:'center',width:20,height:'100%',margin:'-14px 8px -14px -4px',padding:'14px 2px',cursor:'grab',opacity:0.4,flexShrink:0,touchAction:'none' }}
          onClick={(e:any)=>e.stopPropagation()}>
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            {[0,4,8].map(yy=>[0,4].map(xx=><circle key={`${xx}-${yy}`} cx={xx+1} cy={yy+3} r="1.2" fill="var(--border-strong)"/>))}
          </svg>
        </div>
      )}
      <div style={{ width:44,height:44,borderRadius:12,background:av,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0,marginRight:12,fontFamily:'Playfair Display,serif' }}>{initials}</div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:14,fontWeight:700,color:'var(--navy)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:3,fontFamily:'Playfair Display,serif' }}>{person.name}</div>
        <div style={{ fontSize:11.5,color:'var(--text-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:6 }}>{person.designation}</div>
        <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:20,fontSize:10.5,fontWeight:600,color:rel.color,background:rel.bg }}>
          <span style={{ width:5,height:5,borderRadius:'50%',background:rel.color }}/>{rel.label}
        </span>
      </div>
      {/* Action buttons — appear on hover */}
      <div style={{ position:'absolute',top:-10,right:8,display:'flex',gap:3 }} className="org-card-actions">
        <button style={{ width:26,height:26,borderRadius:7,border:'1.5px solid var(--border)',background:'var(--bg-surface)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-3)',transition:'all 150ms' }}
          onPointerDown={(e:any)=>e.stopPropagation()} onClick={(e:any)=>{e.stopPropagation();onEdit(person)}} title="Edit">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        {hasManager && editMode && (
          <button style={{ width:26,height:26,borderRadius:7,border:'1.5px solid var(--border)',background:'var(--bg-surface)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#d97706',transition:'all 150ms' }}
            onPointerDown={(e:any)=>e.stopPropagation()} onClick={(e:any)=>{e.stopPropagation();onDetach(person.id)}} title="Detach from manager">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        )}
        <button style={{ width:26,height:26,borderRadius:7,border:'1.5px solid var(--border)',background:'var(--bg-surface)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#dc2626',transition:'all 150ms' }}
          onPointerDown={(e:any)=>e.stopPropagation()} onClick={(e:any)=>{e.stopPropagation();onRemove(person.id)}} title="Remove">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
        </button>
      </div>
      {isSelected && editMode && (
        <div style={{ position:'absolute',bottom:-28,left:'50%',transform:'translateX(-50%)',whiteSpace:'nowrap',fontSize:10.5,fontWeight:600,color:'var(--gold-muted)',background:'var(--gold-light)',border:'1px solid rgba(212,175,55,0.3)',borderRadius:20,padding:'3px 10px',pointerEvents:'none' }}>
          → click another card to set as manager
        </div>
      )}
    </div>
  )
}

// ─── OrgChart Component ──────────────────────────────────────────────────────
function OrgChart({ accountId }: { accountId: string }) {
  const defaultPeople = (accountId==='revance' ? REVANCE_ORG : TAKEDA_ORG).map(p => ({
    id:p.id, name:p.name, designation:p.designation,
    relationship:p.relationship as 'hot'|'warm'|'cold', managerId:p.managerId,
  }))

  const [people, setPeople] = useState<OrgPerson[]>(defaultPeople)
  const [orientation, setOrientation] = useState<Orientation>('leftright')
  const [saved, setSaved] = useState<OrgPerson[]>(defaultPeople)
  const [draft, setDraft] = useState<OrgPerson[]>(defaultPeople)
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [draggingId, setDraggingId] = useState<string|null>(null)
  const [editingPerson, setEditingPerson] = useState<any>(null)
  const [isNew, setIsNew] = useState(false)
  const [scale, setScale] = useState(1)
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const [loading, setLoading] = useState(true)
  const viewportRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<any>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint:{ distance:8 } }))

  // Load from Supabase on mount
  useEffect(() => {
    getOrgChart(accountId, defaultPeople).then(({ people: p, orientation: o }) => {
      setPeople(p); setSaved(p); setDraft(p); setOrientation(o as Orientation)
    }).finally(() => setLoading(false))
  }, [accountId])

  const showToast = useCallback((msg:string, type:'ok'|'err'='ok') => {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const activePeople = editMode ? draft : saved

  function cycleCheck(ps: OrgPerson[], pid: string, newMgr: string): boolean {
    const visited = new Set<string>()
    let node: string|null = newMgr
    while (node !== null) {
      if (node === pid) return true
      if (visited.has(node)) break
      visited.add(node)
      const cur = node
      node = ps.find(p=>p.id===cur)?.managerId ?? null
    }
    return false
  }

  const handleSelect = useCallback((clickedId: string) => {
    if (!editMode) return
    setSelectedId(prev => {
      if (prev === null) return clickedId
      if (prev === clickedId) return null
      if (cycleCheck(draft, prev, clickedId)) { showToast('⚠ Circular hierarchy — skipped','err'); return null }
      setDraft(ps => ps.map(p => p.id===prev ? {...p, managerId:clickedId} : p))
      showToast('Manager assigned ✓'); return null
    })
  }, [editMode, draft, showToast])

  const handleDragStart = (e: DragStartEvent) => { setSelectedId(null); setDraggingId(e.active.id as string) }
  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingId(null)
    const { active, over } = e
    if (!over) return
    const draggedId = active.id as string
    const targetId = (over.id as string).replace('drop-','')
    if (draggedId===targetId) return
    if (cycleCheck(draft, draggedId, targetId)) { showToast('⚠ Circular hierarchy — skipped','err'); return }
    setDraft(ps => ps.map(p => p.id===draggedId ? {...p, managerId:targetId} : p))
    showToast('Moved ✓')
  }

  // Layout calculation
  const posMap: Record<string,Pos> = {}
  const roots = activePeople.filter(p=>!p.managerId)

  if (orientation === 'topdown') {
    let rx = 0
    for (const root of roots) {
      const tree = layoutTopDown(root.id, activePeople, 0, rx)
      flattenVNode(tree).forEach(n => { posMap[n.id] = { x:n.x, y:n.y } })
      rx += tree.subtreeW + H_GAP*2
    }
  } else {
    let ry = SPINE_ABOVE
    for (const root of roots) {
      const r = layoutLeftRight(root.id, activePeople, 0, ry, posMap)
      ry += r.h + H_GAP*2
    }
  }

  const connectors = activePeople.filter(p=>p.managerId&&posMap[p.id]&&posMap[p.managerId]).map(p=>({pid:p.managerId!,cid:p.id}))
  const spinePos = roots.map(r=>posMap[r.id]).filter(Boolean) as Pos[]
  const allPos = Object.values(posMap)
  const maxX = allPos.length ? Math.max(...allPos.map(p=>p.x)) : 0
  const maxY = allPos.length ? Math.max(...allPos.map(p=>p.y)) : 0
  const canvasW = maxX + CARD_W + 80
  const canvasH = maxY + CARD_H + 80

  const fitToScreen = () => {
    const vp = viewportRef.current
    if (!vp||!allPos.length) return
    const s = Math.min((vp.clientWidth-80)/canvasW, (vp.clientHeight-80)/canvasH, 1.5)
    setScale(Math.max(0.3, Math.round(s*100)/100))
  }

  const saveAndPersist = async () => {
    setSaved(draft); setEditMode(false); setSelectedId(null)
    await saveOrgChart(accountId, draft, orientation)
    showToast('Hierarchy saved ✓')
  }

  const activePerson = draggingId ? activePeople.find(p=>p.id===draggingId) : null

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'var(--text-3)',fontSize:14 }}>Loading org chart...</div>

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-raised)', flexWrap:'wrap' }}>

        {/* Orientation toggle — only visible outside edit mode */}
        {!editMode && (
          <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1.5px solid var(--border)', background:'var(--bg-surface)' }}>
            <button
              onClick={()=>setOrientation('leftright')}
              style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',border:'none',background:orientation==='leftright'?'var(--navy)':'transparent',color:orientation==='leftright'?'#fff':'var(--text-2)',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Source Sans 3,sans-serif',transition:'all 180ms' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/><polyline points="17 8 21 12 17 16"/>
                <line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/>
              </svg>
              Left-Right
            </button>
            <button
              onClick={()=>setOrientation('topdown')}
              style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',border:'none',background:orientation==='topdown'?'var(--navy)':'transparent',color:orientation==='topdown'?'#fff':'var(--text-2)',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Source Sans 3,sans-serif',transition:'all 180ms' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="3" x2="12" y2="21"/><polyline points="8 7 12 3 16 7"/>
                <line x1="5" y1="11" x2="19" y2="11"/><line x1="5" y1="17" x2="19" y2="17"/>
              </svg>
              Top-Down
            </button>
          </div>
        )}

        {editMode && (
          <span style={{ fontSize:12, color:'var(--text-3)', fontStyle:'italic', fontFamily:'Source Sans 3,sans-serif' }}>
            <strong>Drag</strong> cards to rearrange · <strong>click</strong> a card then another to set manager
          </span>
        )}

        {/* Zoom controls */}
        <div style={{ display:'flex',alignItems:'center',gap:4,background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:8,padding:'3px 6px',marginLeft:'auto' }}>
          <button onClick={()=>setScale(s=>Math.max(0.3,+(s-0.1).toFixed(1)))} style={{ width:26,height:26,borderRadius:5,border:'none',background:'transparent',cursor:'pointer',color:'var(--text-2)',fontSize:16,lineHeight:1 }} title="Zoom out">−</button>
          <span style={{ fontSize:11.5,fontWeight:700,color:'var(--text-2)',minWidth:38,textAlign:'center',fontFamily:'Source Sans 3,sans-serif' }}>{Math.round(scale*100)}%</span>
          <button onClick={()=>setScale(s=>Math.min(2,+(s+0.1).toFixed(1)))} style={{ width:26,height:26,borderRadius:5,border:'none',background:'transparent',cursor:'pointer',color:'var(--text-2)',fontSize:16,lineHeight:1 }} title="Zoom in">+</button>
          <button onClick={fitToScreen} style={{ width:26,height:26,borderRadius:5,border:'none',background:'transparent',cursor:'pointer',color:'var(--text-2)',fontSize:13,lineHeight:1 }} title="Fit to screen">⊞</button>
        </div>

        <div style={{ width:1,height:20,background:'var(--border)' }}/>

        {editMode ? (
          <div style={{ display:'flex',gap:7 }}>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setDraft(saved);setEditMode(false);showToast('Discarded','err')}}>Discard</button>
            <button className="btn btn-navy btn-sm" style={{ display:'flex',alignItems:'center',gap:5 }} onClick={saveAndPersist}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Save
            </button>
          </div>
        ) : (
          <div style={{ display:'flex',gap:7 }}>
            <button onClick={()=>{setEditingPerson({id:'',name:'',designation:'',relationship:'cold',managerId:null});setIsNew(true)}} style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--bg-surface)',cursor:'pointer',fontSize:12.5,color:'var(--text-2)',fontFamily:'Source Sans 3,sans-serif',fontWeight:600 }}>
              <Plus size={12}/> Add Person
            </button>
            <button onClick={()=>{setDraft(saved.map(p=>({...p})));setEditMode(true);showToast('Edit mode — drag to build hierarchy')}} style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:7,border:'1px solid var(--navy)',background:'transparent',cursor:'pointer',fontSize:12.5,color:'var(--navy)',fontFamily:'Source Sans 3,sans-serif',fontWeight:700 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Hierarchy
            </button>
            <span style={{ fontSize:12,color:'var(--text-3)',alignSelf:'center',fontFamily:'Source Sans 3,sans-serif' }}>{activePeople.length} people</span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div ref={viewportRef} style={{ flex:1,overflow:'auto',background:'var(--bg-base)',backgroundImage:'radial-gradient(circle, rgba(27,54,93,0.15) 1.2px, transparent 1.2px)',backgroundSize:'26px 26px',minHeight:400 }}
          onClick={()=>setSelectedId(null)}>
          <div style={{ display:'inline-block', transform:`scale(${scale})`, transformOrigin:'top left', padding:'48px 60px 80px' }}
            onClick={(e:any)=>e.stopPropagation()}>
            <div style={{ position:'relative', width:canvasW, height:canvasH }}>
              <svg style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'visible' }} width={canvasW} height={canvasH}>
                {/* Spine */}
                {spinePos.length > 0 && orientation === 'leftright' && (() => {
                  const spineX = spinePos[0].x - SPINE_ABOVE/2
                  const topY = spinePos[0].y + CARD_H/2
                  const botY = spinePos[spinePos.length-1].y + CARD_H/2
                  return <g>
                    {spinePos.length > 1 && <line x1={spineX} y1={topY} x2={spineX} y2={botY} stroke="var(--border-strong)" strokeWidth="2"/>}
                    {spinePos.map((p,i)=>{
                      const cy = p.y+CARD_H/2
                      return <g key={i}><line x1={spineX} y1={cy} x2={p.x} y2={cy} stroke="var(--border-strong)" strokeWidth="2"/><circle cx={spineX} cy={cy} r="4" fill="var(--border-strong)"/></g>
                    })}
                  </g>
                })()}
                {spinePos.length > 0 && orientation === 'topdown' && (() => {
                  if (spinePos.length === 1) {
                    const cx = spinePos[0].x + CARD_W/2
                    const spineY = spinePos[0].y - SPINE_ABOVE/2
                    return <g><line x1={cx} y1={spineY} x2={cx} y2={spinePos[0].y} stroke="var(--border-strong)" strokeWidth="2"/><circle cx={cx} cy={spineY} r="4" fill="var(--border-strong)"/></g>
                  }
                  const spineY = spinePos[0].y - SPINE_ABOVE/2
                  const leftX = spinePos[0].x + CARD_W/2
                  const rightX = spinePos[spinePos.length-1].x + CARD_W/2
                  return <g>
                    <line x1={leftX} y1={spineY} x2={rightX} y2={spineY} stroke="var(--border-strong)" strokeWidth="2"/>
                    {spinePos.map((p,i)=>{
                      const cx = p.x + CARD_W/2
                      return <g key={i}><line x1={cx} y1={spineY} x2={cx} y2={p.y} stroke="var(--border-strong)" strokeWidth="2"/><circle cx={cx} cy={spineY} r="4" fill="var(--border-strong)"/></g>
                    })}
                  </g>
                })()}
                {/* Connectors */}
                {connectors.map(({pid,cid})=>{
                  const p=posMap[pid], c=posMap[cid]
                  if(!p||!c) return null
                  return orientation==='topdown'
                    ? <ConnTopDown key={`${pid}-${cid}`} px={p.x} py={p.y} cx={c.x} cy={c.y}/>
                    : <ConnLeftRight key={`${pid}-${cid}`} px={p.x} py={p.y} cx={c.x} cy={c.y}/>
                })}
              </svg>
              {activePeople.map(person => {
                const pos = posMap[person.id]
                if (!pos) return null
                return <ProperOrgCard key={person.id} person={person} x={pos.x} y={pos.y}
                  isSelected={selectedId===person.id} draggingId={draggingId} editMode={editMode}
                  onSelect={handleSelect}
                  onEdit={(p:any)=>{setEditingPerson({...p});setIsNew(false)}}
                  onRemove={(id:string)=>{
                    const upd=(ps:OrgPerson[])=>ps.filter(p=>p.id!==id).map(p=>p.managerId===id?{...p,managerId:null}:p)
                    if(editMode) setDraft(upd); else { setSaved(upd); saveOrgChart(accountId,upd(saved),orientation) }
                    showToast('Removed')
                  }}
                  onDetach={(id:string)=>{ setDraft(ps=>ps.map(p=>p.id===id?{...p,managerId:null}:p)); showToast('Detached') }}
                />
              })}
            </div>
          </div>
        </div>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activePerson && (() => {
              const rel = REL[activePerson.relationship] || REL.cold
              const idx = parseInt(activePerson.id.replace(/\D/g,'')) || 0
              const av = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              const initials = activePerson.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)
              return (
                <div style={{ width:CARD_W,background:'var(--bg-surface)',border:'2px solid var(--gold)',borderRadius:14,display:'flex',alignItems:'center',padding:'14px 16px',boxShadow:'0 20px 60px rgba(27,54,93,0.3)',transform:'rotate(1.5deg) scale(1.04)',cursor:'grabbing' }}>
                  <div style={{ width:44,height:44,borderRadius:12,background:av,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0,marginRight:12 }}>{initials}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:14,fontWeight:700,color:'var(--navy)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:3 }}>{activePerson.name}</div>
                    <div style={{ fontSize:11.5,color:'var(--text-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:6 }}>{activePerson.designation}</div>
                    <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:20,fontSize:10.5,fontWeight:600,color:rel.color,background:rel.bg }}>
                      <span style={{ width:5,height:5,borderRadius:'50%',background:rel.color }}/>{rel.label}
                    </span>
                  </div>
                </div>
              )
            })()}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Edit modal */}
      {editingPerson && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 }} onClick={()=>setEditingPerson(null)}>
          <div style={{ background:'var(--bg-surface)',borderRadius:16,padding:24,width:400,maxWidth:'94vw',boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e:any)=>e.stopPropagation()}>
            <h3 style={{ fontFamily:'Playfair Display,serif',fontSize:18,color:'var(--navy)',marginBottom:16 }}>{isNew?'Add Person':'Edit Person'}</h3>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {[{k:'name',l:'Full Name'},{k:'designation',l:'Title / Designation'}].map(f=>(
                <div key={f.k}>
                  <div style={{ fontSize:12.5,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:5,fontFamily:'Source Sans 3,sans-serif' }}>{f.l}</div>
                  <input className="input" value={(editingPerson as any)[f.k]||''} onChange={e=>setEditingPerson((p:any)=>({...p,[f.k]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <div style={{ fontSize:12.5,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8,fontFamily:'Source Sans 3,sans-serif' }}>Relationship</div>
                <div style={{ display:'flex',gap:8 }}>
                  {(['cold','warm','hot'] as const).map(r=>(
                    <button key={r} onClick={()=>setEditingPerson((p:any)=>({...p,relationship:r}))}
                      style={{ flex:1,padding:'7px 14px',borderRadius:20,border:`1px solid ${editingPerson.relationship===r?REL[r].color:'var(--border)'}`,background:editingPerson.relationship===r?REL[r].bg:'transparent',color:editingPerson.relationship===r?REL[r].color:'var(--text-3)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Source Sans 3,sans-serif',transition:'all 150ms' }}>
                      {REL[r].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'flex',justifyContent:'flex-end',gap:8,marginTop:20 }}>
              <button className="btn btn-ghost" onClick={()=>setEditingPerson(null)}>Cancel</button>
              <button className="btn btn-navy" onClick={()=>{
                if (!editingPerson.name?.trim()) return
                if (isNew) {
                  const np = {...editingPerson, id:`org_${Date.now()}`}
                  if(editMode) setDraft(ps=>[...ps,np]); else { const u=[...saved,np]; setSaved(u); saveOrgChart(accountId,u,orientation) }
                  showToast('Added ✓')
                } else {
                  if(editMode) setDraft(ps=>ps.map(p=>p.id===editingPerson.id?editingPerson:p))
                  else { const u=saved.map(p=>p.id===editingPerson.id?editingPerson:p); setSaved(u); saveOrgChart(accountId,u,orientation) }
                  showToast('Saved ✓')
                }
                setEditingPerson(null)
              }}>{isNew?'Add to Org':'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',padding:'9px 18px',borderRadius:22,background:toast.type==='err'?'#dc2626':'var(--navy)',color:'#fff',fontSize:13,fontWeight:700,zIndex:10000,boxShadow:'0 8px 24px rgba(0,0,0,0.25)',fontFamily:'Source Sans 3,sans-serif',animation:'pageIn 200ms ease' }}>{toast.msg}</div>}
    </div>
  )
}

// ─── Main ExecCapitalPage ─────────────────────────────────────────────────────
export default function ExecCapitalPage() {
  const nav = useNavigate()
  const [view, setView] = useState<'list'|'org'>('list')
  const [filterAccount, setFilterAccount] = useState('All')
  const [filterText, setFilterText] = useState('')
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set(['andrew-robertson']))
  const [orgAccount, setOrgAccount] = useState('takeda')

  const filtered = ALL_EXECS.filter(e => {
    const acctMatch = filterAccount==='All' || ACCOUNTS_LIST.find(a=>a.id===e.companyId)?.name===filterAccount
    const textMatch = !filterText || e.name.toLowerCase().includes(filterText.toLowerCase()) || e.title.toLowerCase().includes(filterText.toLowerCase())
    return acctMatch && textMatch
  })

  const toggleBookmark = (id: string) => setBookmarked(b=>{const n=new Set(b);n.has(id)?n.delete(id):n.add(id);return n})
  const relColors: any = { cold:'#1a4a8a', warm:'#b89428', hot:'#e85d04' }
  const relBgs: any = { cold:'#edf2fb', warm:'#fdf8e8', hot:'#fff3ed' }
  const AVCOLORS = ['#c62a2a','#1a4a8a','#5a3fa0','#a05a00','#0f7a6e','#b89428','#1B365D']

  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:10.5,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:4 }}>ACCOUNTS</div>
        <h1 style={{ fontFamily:'Playfair Display,serif',fontSize:28,color:'var(--navy)',margin:0 }}>Exec Capital</h1>
      </div>

      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20 }}>
        <select className="select" value={filterAccount} onChange={e=>setFilterAccount(e.target.value)} style={{ minWidth:200 }}>
          <option value="All">All Accounts</option>
          {ACCOUNTS_LIST.map(a=><option key={a.id}>{a.name}</option>)}
        </select>
        <input className="input" placeholder="Filter executives..." value={filterText} onChange={e=>setFilterText(e.target.value)} style={{ maxWidth:300 }}/>
        <div style={{ flex:1 }}/>
        <div style={{ fontSize:13,color:'var(--text-3)',fontFamily:'Source Sans 3,sans-serif' }}>{filtered.length} executives</div>
        <div style={{ display:'flex',border:'1px solid var(--border)',borderRadius:8,overflow:'hidden' }}>
          {([['list','List View'],['org','Org Chart']] as const).map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{ padding:'7px 16px',background:view===v?'var(--navy)':'transparent',color:view===v?'#fff':'var(--text-3)',border:'none',cursor:'pointer',fontFamily:'Source Sans 3,sans-serif',fontSize:13,fontWeight:view===v?600:400,transition:'all 180ms' }}>{l}</button>
          ))}
        </div>
      </div>

      {view==='list' ? (
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          {filtered.map((exec,idx) => {
            const sc = relColors[exec.status]
            const sb = relBgs[exec.status]
            const av = AVCOLORS[idx%AVCOLORS.length]
            const initials = exec.name.split(' ').map(n=>n[0]).join('').slice(0,2)
            const isBm = bookmarked.has(exec.id)
            return (
              <div key={exec.id} className="card" style={{ overflow:'hidden' }}>
                <div style={{ display:'flex',alignItems:'flex-start',gap:16,padding:'16px 20px',borderBottom:'0.5px solid var(--border)' }}>
                  <div style={{ width:52,height:52,borderRadius:'50%',background:av,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',fontFamily:'Sora,sans-serif',flexShrink:0 }}>{initials}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:3,flexWrap:'wrap' }}>
                      <span style={{ fontFamily:'Playfair Display,serif',fontSize:16,color:'var(--navy)' }}>{exec.name}</span>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'2px 9px',borderRadius:20,background:sb,color:sc,fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em' }}>
                        <span style={{ width:5,height:5,borderRadius:'50%',background:sc }}/>{exec.status.toUpperCase()}
                      </span>
                      {isBm && <span style={{ fontSize:10.5,color:'var(--gold-muted)',background:'var(--gold-light)',border:'0.5px solid var(--gold-pale)',borderRadius:4,padding:'2px 7px',fontWeight:600 }}>⭐ Bookmarked</span>}
                    </div>
                    <div style={{ fontSize:13.5,color:'var(--text-3)',fontFamily:'Source Sans 3,sans-serif' }}>{exec.title} | {exec.company}</div>
                  </div>
                  <div style={{ display:'flex',gap:8,flexShrink:0 }}>
                    <button onClick={()=>toggleBookmark(exec.id)} className="btn btn-ghost btn-sm" style={{ color:isBm?'var(--gold-muted)':undefined,fontSize:12 }}>
                      {isBm?<BookmarkCheck size={12}/>:<Bookmark size={12}/>} {isBm?'BOOKMARKED':'BOOKMARK'}
                    </button>
                    <button className="btn btn-navy btn-sm" style={{ fontSize:12 }} onClick={()=>nav(`/accounts/exec-capital/${exec.id}`)}>VIEW DETAILS</button>
                  </div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'14px 20px',gap:16 }}>
                  {[
                    { label:'Persona Quadrant',    value:exec.personaQuadrant,                                highlight:true },
                    { label:'Behavioural Trait',   value:exec.behaviouralTraits?.join(' · ') },
                    { label:'Freyr Mapping',    value:String(exec.freyrMapping),   numeric:true },
                    { label:'Network Connections', value:String(exec.networkConnections),numeric:true },
                    { label:'Key Conferences',     value:exec.conferences?.[0]||'—' },
                  ].map(col=>(
                    <div key={col.label}>
                      <div style={{ fontSize:10.5,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6,fontFamily:'Source Sans 3,sans-serif' }}>{col.label}</div>
                      <div style={{ fontSize:(col as any).numeric?22:13.5,fontWeight:(col as any).numeric?700:(col as any).highlight?600:400,color:(col as any).highlight?'var(--navy)':'var(--text-1)',fontFamily:(col as any).numeric?'Playfair Display,serif':'Source Sans 3,sans-serif',lineHeight:1.4 }}>{col.value||'—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'0.5px solid var(--border)',background:'var(--bg-raised)' }}>
            <span style={{ fontSize:13,fontWeight:600,color:'var(--text-2)',fontFamily:'Source Sans 3,sans-serif' }}>Account:</span>
            <select className="select" value={orgAccount} onChange={e=>setOrgAccount(e.target.value)} style={{ maxWidth:280 }}>
              {ACCOUNTS_LIST.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{ height:600 }}>
            <OrgChart key={orgAccount} accountId={orgAccount}/>
          </div>
        </div>
      )}

      <style>{`
        .org-card-actions { opacity: 0; pointer-events: none; transition: opacity 150ms; }
        div:hover > .org-card-actions { opacity: 1; pointer-events: all; }
      `}</style>
    </div>
  )
}
