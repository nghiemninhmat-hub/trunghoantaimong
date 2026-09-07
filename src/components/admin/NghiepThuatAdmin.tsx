import { useState, useMemo } from 'react';
import {
  Sparkles, Plus, Save, Edit3, Trash2, Search, UserSearch, User,
  Brain, Heart, Sparkle, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Lock,
} from 'lucide-react';
import StatusTagSelector from '@/components/StatusTagSelector';
import type { Profile, SkillTemplate } from '@/lib/supabase';

type NewTemplate = {
  name: string; usage_detail: string; effect: string; tradeoff: string;
  cong_duc_cost: number; am_duc_cost: number; duration: string;
  mental_effect: string; mental_duration: number;
  health_effect: string; health_duration: number;
  spiritual_effect: string; spiritual_duration: number;
  ghost_level_effect: string; destruction_percent: number; category: string;
};

type Props = {
  skillTemplates: SkillTemplate[];
  allProfiles: Profile[];
  allSkills: Record<string, unknown[]>;
  templateMsg: string;
  showAddTemplate: boolean;
  setShowAddTemplate: (v: boolean) => void;
  editingTemplateId: string | null;
  setEditingTemplateId: (v: string | null) => void;
  editTemplate: Partial<SkillTemplate>;
  setEditTemplate: (v: Partial<SkillTemplate>) => void;
  newTemplate: NewTemplate;
  setNewTemplate: (v: NewTemplate) => void;
  assignTemplateId: string | null;
  setAssignTemplateId: (v: string | null) => void;
  assignTargetUserId: string;
  setAssignTargetUserId: (v: string) => void;
  assignSlot: number;
  setAssignSlot: (v: number) => void;
  onAdd: (e: React.FormEvent) => void;
  onEdit: (t: SkillTemplate) => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onAssign: () => void;
  fetchSkillsForUser: (userId: string) => void;
  inputCls: string;
  labelCls: string;
  cardCls: string;
};

export default function NghiepThuatAdmin(props: Props) {
  const {
    skillTemplates, allProfiles, allSkills, templateMsg,
    showAddTemplate, setShowAddTemplate,
    editingTemplateId, setEditingTemplateId,
    editTemplate, setEditTemplate,
    newTemplate, setNewTemplate,
    assignTemplateId, setAssignTemplateId,
    assignTargetUserId, setAssignTargetUserId,
    assignSlot, setAssignSlot,
    onAdd, onEdit, onSaveEdit, onDelete, onAssign,
    fetchSkillsForUser,
    inputCls, labelCls, cardCls,
  } = props;

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPheDuyet, setFilterPheDuyet] = useState('');
  const [showAssignPanel, setShowAssignPanel] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(skillTemplates.map(t => t.category).filter(Boolean))) as string[],
    [skillTemplates],
  );

  const filtered = useMemo(() => {
    return skillTemplates.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        (t.oc_name?.toLowerCase().includes(q) ?? false) ||
        (t.effect?.toLowerCase().includes(q) ?? false) ||
        (t.nghe?.toLowerCase().includes(q) ?? false);
      const matchCat = !filterCategory || t.category === filterCategory;
      const matchPhe = !filterPheDuyet || t.phe_duyet === filterPheDuyet;
      return matchSearch && matchCat && matchPhe;
    });
  }, [skillTemplates, search, filterCategory, filterPheDuyet]);

  return (
    <div className="space-y-4">
      {templateMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${templateMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
          {templateMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {templateMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kỹ năng, OC, hiệu quả..."
            className={`${inputCls} pl-9`}
          />
        </div>
        {categories.length > 0 && (
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="">Tất cả nhóm</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select value={filterPheDuyet} onChange={e => setFilterPheDuyet(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">Tất cả trạng thái</option>
          <option value="Đã duyệt">Đã duyệt</option>
          <option value="Chưa duyệt">Chưa duyệt</option>
        </select>
        <button
          onClick={() => setShowAssignPanel(!showAssignPanel)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-300 text-sm font-bold border border-cyan-500/25 transition-all whitespace-nowrap"
        >
          <UserSearch className="w-4 h-4" /> Cấp kỹ năng
        </button>
        <button
          onClick={() => setShowAddTemplate(!showAddTemplate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#670201]/20 hover:bg-[#670201]/30 text-amber-100 text-sm font-bold border border-[#670201]/30 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Thêm mẫu
        </button>
      </div>

      {/* Assign panel (collapsible) */}
      {showAssignPanel && (
        <div className={`${cardCls} border-cyan-500/15`}>
          <div className="flex items-center gap-2 mb-3">
            <UserSearch className="w-4 h-4 text-cyan-300" />
            <h3 className="text-sm font-serif font-bold text-amber-100/80">Cấp Kỹ Năng Từ Mẫu</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={assignTemplateId || ''} onChange={e => setAssignTemplateId(e.target.value || null)} className={inputCls}>
              <option value="">Chọn mẫu...</option>
              {skillTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}{t.oc_name ? ` — ${t.oc_name}` : ''}{t.category ? ` (${t.category})` : ''}</option>
              ))}
            </select>
            <select value={assignTargetUserId} onChange={e => { const userId = e.target.value; setAssignTargetUserId(userId); if (userId) fetchSkillsForUser(userId); }} className={inputCls}>
              <option value="">Chọn người chơi...</option>
              {allProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.oc_name} · {p.email}</option>
              ))}
            </select>
            <select value={assignSlot} onChange={e => setAssignSlot(Math.min(4, Math.max(1, parseInt(e.target.value) || 1)))} className={inputCls}>
              <option value={1}>Slot 1</option>
              <option value={2}>Slot 2</option>
              <option value={3}>Slot 3</option>
              <option value={4}>Slot 4</option>
            </select>
            <button onClick={onAssign} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 text-sm font-bold rounded-lg border border-cyan-500/30 transition-all">
              <Sparkles className="w-4 h-4" /> Cấp
            </button>
          </div>
          {assignTargetUserId && (() => {
            const currentSkills = (allSkills[assignTargetUserId] || []) as Record<string, unknown>[];
            return (
              <div className="mt-3 flex flex-wrap gap-2">
                {currentSkills.length === 0 ? (
                  <span className="text-xs text-gray-500 italic">Chưa có kỹ năng nào.</span>
                ) : currentSkills.map(skill => (
                  <button
                    key={String(skill.id)}
                    onClick={() => setAssignSlot(Number(skill.slot) || 1)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-gray-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
                  >
                    Slot {String(skill.slot)} · {String(skill.name || 'Chưa đặt tên')}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Add form (collapsible) */}
      {showAddTemplate && (
        <form onSubmit={onAdd} className={`${cardCls} space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Plus className="w-4 h-4 text-amber-300" />
            <h3 className="text-sm font-serif font-bold text-amber-100/80">Thêm Mẫu Kỹ Năng Mới</h3>
          </div>
          <TemplateFormFields
            template={newTemplate}
            setTemplate={(v) => setNewTemplate({ ...newTemplate, ...v } as NewTemplate)}
            inputCls={inputCls}
            labelCls={labelCls}
          />
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
              <Save className="w-4 h-4" /> Lưu
            </button>
            <button type="button" onClick={() => setShowAddTemplate(false)} className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold">Hủy</button>
          </div>
        </form>
      )}

      {/* Template list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          {skillTemplates.length === 0 ? 'Chưa có mẫu kỹ năng nào.' : 'Không tìm thấy kỹ năng phù hợp.'}
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="md:hidden space-y-2">
            {filtered.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                isEditing={editingTemplateId === t.id}
                editTemplate={editTemplate}
                setEditTemplate={setEditTemplate}
                onEdit={() => onEdit(t)}
                onSave={() => onSaveEdit(t.id)}
                onCancel={() => { setEditingTemplateId(null); setEditTemplate({}); }}
                onDelete={() => onDelete(t.id, t.name)}
                inputCls={inputCls}
                labelCls={labelCls}
              />
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-[#170707]/95">
                  <th className="px-3 py-2.5 text-left font-semibold text-amber-300/70 border-b border-[#670201]/20 whitespace-nowrap">Kỹ năng</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-amber-300/70 border-b border-[#670201]/20 whitespace-nowrap hidden lg:table-cell">Nhóm</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-amber-300/70 border-b border-[#670201]/20 whitespace-nowrap hidden lg:table-cell">OC</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-amber-300/70 border-b border-[#670201]/20 whitespace-nowrap hidden lg:table-cell">Chi phí</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-amber-300/70 border-b border-[#670201]/20 whitespace-nowrap">Trạng thái</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-amber-300/70 border-b border-[#670201]/20 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <TemplateRow
                    key={t.id}
                    template={t}
                    isEditing={editingTemplateId === t.id}
                    editTemplate={editTemplate}
                    setEditTemplate={setEditTemplate}
                    onEdit={() => onEdit(t)}
                    onSave={() => onSaveEdit(t.id)}
                    onCancel={() => { setEditingTemplateId(null); setEditTemplate({}); }}
                    onDelete={() => onDelete(t.id, t.name)}
                    inputCls={inputCls}
                    labelCls={labelCls}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-gray-600 text-center">
        {filtered.length} / {skillTemplates.length} mẫu kỹ năng
        <span className="inline-flex items-center gap-1 ml-2"><Lock className="w-3 h-3" />Chỉ quản trị viên</span>
      </p>
    </div>
  );
}

/** Shared expanded details renderer for mobile + desktop */
function ExpandedDetails({ t }: { t: SkillTemplate }) {
  return (
    <div className="space-y-2 text-xs">
      {t.usage_detail && (
        <div><span className="text-amber-300/50 font-semibold uppercase tracking-wider">Chi tiết: </span><span className="text-gray-400">{t.usage_detail}</span></div>
      )}
      {t.effect && (
        <div><span className="text-amber-300/50 font-semibold uppercase tracking-wider">Hiệu quả: </span><span className="text-gray-400">{t.effect}</span></div>
      )}
      {t.tradeoff && (
        <div><span className="text-amber-300/50 font-semibold uppercase tracking-wider">Đánh đổi: </span><span className="text-gray-400">{t.tradeoff}</span></div>
      )}
      {t.ghost_level_effect && (
        <div><span className="text-amber-300/50 font-semibold uppercase tracking-wider">Tác động quỷ: </span><span className="text-gray-400">{t.ghost_level_effect}</span></div>
      )}
      {t.duration && (
        <div><span className="text-amber-300/50 font-semibold uppercase tracking-wider">Duy trì: </span><span className="text-gray-400">{t.duration}</span></div>
      )}
      {(t.mental_effect || t.health_effect || t.spiritual_effect) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {t.mental_effect && <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px]">Tinh thần: {t.mental_effect}{t.mental_duration > 0 ? ` (${t.mental_duration} cmt)` : ''}</span>}
          {t.health_effect && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-300 text-[10px]">Thể chất: {t.health_effect}{t.health_duration > 0 ? ` (${t.health_duration} cmt)` : ''}</span>}
          {t.spiritual_effect && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">Tâm linh: {t.spiritual_effect}{t.spiritual_duration > 0 ? ` (${t.spiritual_duration} cmt)` : ''}</span>}
        </div>
      )}
      {t.account && (
        <div className="text-[10px] text-gray-600 pt-1">Tài khoản: {t.account}</div>
      )}
    </div>
  );
}

/** Mobile card layout for each skill template */
function TemplateCard({
  template: t, isEditing, editTemplate, setEditTemplate,
  onEdit, onSave, onCancel, onDelete, inputCls, labelCls,
}: {
  template: SkillTemplate;
  isEditing: boolean;
  editTemplate: Partial<SkillTemplate>;
  setEditTemplate: (v: Partial<SkillTemplate>) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  inputCls: string;
  labelCls: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (isEditing) {
    return (
      <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Edit3 className="w-4 h-4 text-amber-300" />
          <span className="text-sm font-bold text-amber-100/80">Sửa: {t.name}</span>
        </div>
        <TemplateFormFields
          template={{
            name: editTemplate.name ?? '',
            category: editTemplate.category ?? '',
            usage_detail: editTemplate.usage_detail ?? '',
            effect: editTemplate.effect ?? '',
            tradeoff: editTemplate.tradeoff ?? '',
            cong_duc_cost: editTemplate.cong_duc_cost ?? 0,
            am_duc_cost: editTemplate.am_duc_cost ?? 0,
            duration: editTemplate.duration ?? '',
            mental_effect: editTemplate.mental_effect ?? '',
            mental_duration: editTemplate.mental_duration ?? 0,
            health_effect: editTemplate.health_effect ?? '',
            health_duration: editTemplate.health_duration ?? 0,
            spiritual_effect: editTemplate.spiritual_effect ?? '',
            spiritual_duration: editTemplate.spiritual_duration ?? 0,
            ghost_level_effect: editTemplate.ghost_level_effect ?? '',
            destruction_percent: editTemplate.destruction_percent ?? 0,
          }}
          setTemplate={(v) => setEditTemplate({ ...editTemplate, ...v })}
          inputCls={inputCls}
          labelCls={labelCls}
        />
        <div className="flex gap-2">
          <button onClick={onSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Save className="w-3.5 h-3.5" /> Lưu
          </button>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">Hủy</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-black/20 border border-white/10 overflow-hidden">
      {/* Header: tap to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-2 p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-amber-100/90 text-sm">{t.name}</span>
            {t.destruction_percent > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 whitespace-nowrap">{t.destruction_percent}%</span>
            )}
            {t.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">{t.category}</span>}
            {t.phe_duyet && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.phe_duyet === 'Đã duyệt' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-orange-500/15 text-orange-300'}`}>{t.phe_duyet}</span>
            )}
          </div>
          {t.effect && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.effect}</p>}
          {/* Meta row */}
          <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-gray-600">
            {t.oc_name && <span className="inline-flex items-center gap-0.5 text-amber-400/70"><User className="w-2.5 h-2.5" />{t.oc_name}</span>}
            {t.nghe && <span>{t.nghe}</span>}
            {(t.cong_duc_cost > 0 || t.am_duc_cost > 0) && (
              <span>
                {t.cong_duc_cost > 0 ? `${t.cong_duc_cost} CD` : ''}
                {t.cong_duc_cost > 0 && t.am_duc_cost > 0 ? ' + ' : ''}
                {t.am_duc_cost > 0 ? `${t.am_duc_cost} ÂD` : ''}
              </span>
            )}
            {t.duration && <span>{t.duration}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-gray-600">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-white/5 pt-3">
          <ExpandedDetails t={t} />
          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all">
              <Edit3 className="w-3.5 h-3.5" /> Sửa
            </button>
            <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Xóa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Desktop table row for each skill template */
function TemplateRow({
  template: t, isEditing, editTemplate, setEditTemplate,
  onEdit, onSave, onCancel, onDelete, inputCls, labelCls,
}: {
  template: SkillTemplate;
  isEditing: boolean;
  editTemplate: Partial<SkillTemplate>;
  setEditTemplate: (v: Partial<SkillTemplate>) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  inputCls: string;
  labelCls: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (isEditing) {
    return (
      <tr>
        <td colSpan={6} className="p-0">
          <div className="p-4 bg-black/30 space-y-4">
            <TemplateFormFields
              template={{
                name: editTemplate.name ?? '',
                category: editTemplate.category ?? '',
                usage_detail: editTemplate.usage_detail ?? '',
                effect: editTemplate.effect ?? '',
                tradeoff: editTemplate.tradeoff ?? '',
                cong_duc_cost: editTemplate.cong_duc_cost ?? 0,
                am_duc_cost: editTemplate.am_duc_cost ?? 0,
                duration: editTemplate.duration ?? '',
                mental_effect: editTemplate.mental_effect ?? '',
                mental_duration: editTemplate.mental_duration ?? 0,
                health_effect: editTemplate.health_effect ?? '',
                health_duration: editTemplate.health_duration ?? 0,
                spiritual_effect: editTemplate.spiritual_effect ?? '',
                spiritual_duration: editTemplate.spiritual_duration ?? 0,
                ghost_level_effect: editTemplate.ghost_level_effect ?? '',
                destruction_percent: editTemplate.destruction_percent ?? 0,
              }}
              setTemplate={(v) => setEditTemplate({ ...editTemplate, ...v })}
              inputCls={inputCls}
              labelCls={labelCls}
            />
            <div className="flex gap-2">
              <button onClick={onSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                <Save className="w-3.5 h-3.5" /> Lưu thay đổi
              </button>
              <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">Hủy</button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="hover:bg-white/[0.02] transition-colors">
        <td className="px-3 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-amber-300 transition-colors flex-shrink-0">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="font-semibold text-amber-100/90 truncate">{t.name}</span>
            {t.destruction_percent > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 whitespace-nowrap">{t.destruction_percent}%</span>
            )}
          </div>
          {t.effect && <p className="text-xs text-gray-500 mt-1 line-clamp-1 pl-6">{t.effect}</p>}
        </td>
        <td className="px-3 py-2.5 border-b border-white/5 hidden lg:table-cell">
          {t.category ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">{t.category}</span> : <span className="text-gray-600">—</span>}
        </td>
        <td className="px-3 py-2.5 border-b border-white/5 hidden lg:table-cell">
          {t.oc_name ? (
            <span className="inline-flex items-center gap-1 text-xs text-amber-400/70"><User className="w-2.5 h-2.5" />{t.oc_name}</span>
          ) : <span className="text-gray-600">—</span>}
          {t.nghe && <span className="block text-[10px] text-gray-600">{t.nghe}</span>}
        </td>
        <td className="px-3 py-2.5 border-b border-white/5 hidden lg:table-cell text-xs text-gray-400 whitespace-nowrap">
          {t.cong_duc_cost > 0 && <span>{t.cong_duc_cost} CD</span>}
          {t.cong_duc_cost > 0 && t.am_duc_cost > 0 && <span> + </span>}
          {t.am_duc_cost > 0 && <span>{t.am_duc_cost} ÂD</span>}
          {t.cong_duc_cost === 0 && t.am_duc_cost === 0 && <span className="text-gray-600">—</span>}
        </td>
        <td className="px-3 py-2.5 border-b border-white/5 whitespace-nowrap">
          {t.phe_duyet ? (
            <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${t.phe_duyet === 'Đã duyệt' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-orange-500/15 text-orange-300'}`}>
              {t.phe_duyet}
            </span>
          ) : <span className="text-gray-600 text-xs">—</span>}
        </td>
        <td className="px-3 py-2.5 border-b border-white/5 text-right whitespace-nowrap">
          <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all" title="Sửa">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Xóa">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="p-4 bg-black/20">
              <ExpandedDetails t={t} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type FieldValues = {
  name: string; category: string; usage_detail: string; effect: string; tradeoff: string;
  cong_duc_cost: number; am_duc_cost: number; duration: string;
  mental_effect: string; mental_duration: number;
  health_effect: string; health_duration: number;
  spiritual_effect: string; spiritual_duration: number;
  ghost_level_effect: string; destruction_percent: number;
};

function TemplateFormFields({
  template, setTemplate, inputCls, labelCls,
}: {
  template: FieldValues;
  setTemplate: (v: Partial<FieldValues>) => void;
  inputCls: string;
  labelCls: string;
}) {
  return (
    <div className="space-y-3">
      {/* Row 1: name + category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tên kỹ năng</label>
          <input type="text" value={template.name} onChange={e => setTemplate({ name: e.target.value })} placeholder="vd: Đồng Sinh..." required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nhóm (tùy chọn)</label>
          <input type="text" value={template.category} onChange={e => setTemplate({ category: e.target.value })} placeholder="vd: Y sư, Đạo sĩ..." className={inputCls} />
        </div>
      </div>

      {/* Row 2: usage_detail */}
      <div>
        <label className={labelCls}>Chi tiết cách sử dụng</label>
        <textarea value={template.usage_detail} onChange={e => setTemplate({ usage_detail: e.target.value })} rows={2} placeholder="Mô tả chi tiết..." className={inputCls} />
      </div>

      {/* Row 3: effect */}
      <div>
        <label className={labelCls}>Hiệu quả</label>
        <textarea value={template.effect} onChange={e => setTemplate({ effect: e.target.value })} rows={2} placeholder="Mô tả hiệu quả..." className={inputCls} />
      </div>

      {/* Row 4: tradeoff */}
      <div>
        <label className={labelCls}>Đánh đổi</label>
        <textarea value={template.tradeoff} onChange={e => setTemplate({ tradeoff: e.target.value })} rows={1} placeholder="vd: Không thể sử dụng trong 2-3 dị sự..." className={inputCls} />
      </div>

      {/* Row 5: costs + duration + destruction */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>Công đức</label>
          <input type="number" min={0} value={template.cong_duc_cost} onChange={e => setTemplate({ cong_duc_cost: Math.max(0, parseInt(e.target.value) || 0) })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Âm đức</label>
          <input type="number" min={0} value={template.am_duc_cost} onChange={e => setTemplate({ am_duc_cost: Math.max(0, parseInt(e.target.value) || 0) })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Thời gian duy trì</label>
          <input type="text" value={template.duration} onChange={e => setTemplate({ duration: e.target.value })} placeholder="vd: 3 dị sự" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tiêu diệt %</label>
          <input type="number" min={0} max={100} value={template.destruction_percent} onChange={e => setTemplate({ destruction_percent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} className={inputCls} />
        </div>
      </div>

      {/* Row 6: ghost level effect */}
      <div>
        <label className={labelCls}>Ảnh hưởng lên từng cấp quỷ</label>
        <textarea value={template.ghost_level_effect} onChange={e => setTemplate({ ghost_level_effect: e.target.value })} rows={1} placeholder="vd: Cấp 1: 100%, cấp 2: 80%..." className={inputCls} />
      </div>

      {/* Row 7-9: status effects in a compact 3-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">Tinh thần</span>
          </div>
          <StatusTagSelector category="mental" value={template.mental_effect} onChange={v => setTemplate({ mental_effect: v })} />
          <input type="number" min={0} max={50} value={template.mental_duration} onChange={e => setTemplate({ mental_duration: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })} placeholder="Số cmt" className={`${inputCls} text-xs`} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-300">Thể chất</span>
          </div>
          <StatusTagSelector category="health" value={template.health_effect} onChange={v => setTemplate({ health_effect: v })} />
          <input type="number" min={0} max={50} value={template.health_duration} onChange={e => setTemplate({ health_duration: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })} placeholder="Số cmt" className={`${inputCls} text-xs`} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">Tâm linh</span>
          </div>
          <StatusTagSelector category="spiritual" value={template.spiritual_effect} onChange={v => setTemplate({ spiritual_effect: v })} />
          <input type="number" min={0} max={50} value={template.spiritual_duration} onChange={e => setTemplate({ spiritual_duration: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })} placeholder="Số cmt" className={`${inputCls} text-xs`} />
        </div>
      </div>
    </div>
  );
}
