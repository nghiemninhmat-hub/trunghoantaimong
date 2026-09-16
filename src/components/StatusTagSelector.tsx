import { MENTAL_SUB_TAGS, STATUS_TAGS, HEALTH_SUB_TAGS, SPIRITUAL_SUB_TAGS, parseMultiValue, toggleTag, joinMultiValue, type MentalSubTag } from '@/lib/skillTags';
import { Brain, Heart, Sparkle, Check } from 'lucide-react';

type Category = 'mental' | 'health' | 'spiritual';

type Props = {
  category: Category;
  value: string;
  onChange: (newValue: string) => void;
};

const CATEGORY_CONFIG: Record<Category, { icon: typeof Brain; label: string; color: string; dot: string }> = {
  mental: { icon: Brain, label: 'Tinh Thần', color: 'text-purple-400', dot: 'bg-purple-400' },
  health: { icon: Heart, label: 'Thể Chất', color: 'text-red-400', dot: 'bg-red-400' },
  spiritual: { icon: Sparkle, label: 'Tâm Linh', color: 'text-amber-400', dot: 'bg-amber-400' },
};

const DOT_COLOR: Record<string, string> = {
  'Bình Thường': 'bg-emerald-400',
  'Ảnh hưởng nhẹ': 'bg-yellow-400',
  'Nghiêm trọng': 'bg-red-400',
  'Cực kỳ nghiêm trọng': 'bg-red-600',
  'Suy kiệt': 'bg-purple-400',
  'Ngưỡng sinh tử': 'bg-purple-700',
};

function GroupedTagSelector({ subTags, value, onChange }: { subTags: MentalSubTag[]; value: string; onChange: (v: string) => void }) {
  const selected = parseMultiValue(value);
  const selectedSet = new Set(selected);

  const grouped = STATUS_TAGS.map(tag => {
    const subs = subTags.filter(s => s.parent === tag.value);
    return { tag, subs };
  }).filter(g => g.subs.length > 0);

  return (
    <div className="space-y-1.5">
      {grouped.map(({ tag, subs }) => {
        const hasSelected = subs.some(s => selectedSet.has(s.value));
        return (
          <div key={tag.value} className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap ${hasSelected ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[tag.value] || 'bg-gray-500'}`} />
              {tag.label}
              {hasSelected && <Check className="w-2.5 h-2.5 text-emerald-400" />}
            </span>
            {subs.map(sub => {
              const isActive = selectedSet.has(sub.value);
              return (
                <button
                  key={sub.value}
                  type="button"
                  onClick={() => onChange(joinMultiValue(toggleTag(selected, sub.value)))}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                  }`}
                >
                  {sub.value}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function StatusTagSelector({ category, value, onChange }: Props) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  const subTags = category === 'mental' ? MENTAL_SUB_TAGS : category === 'health' ? HEALTH_SUB_TAGS : SPIRITUAL_SUB_TAGS;

  return (
    <div className="rounded-lg bg-black/20 p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3 h-3 ${config.color} flex-shrink-0`} />
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">{config.label}</span>
      </div>
      <GroupedTagSelector subTags={subTags} value={value} onChange={onChange} />
    </div>
  );
}
