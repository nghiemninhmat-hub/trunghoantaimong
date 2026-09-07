import { MENTAL_SUB_TAGS, STATUS_TAGS, HEALTH_SUB_TAGS, SPIRITUAL_SUB_TAGS, parseMultiValue, toggleTag, joinMultiValue, type MentalTag } from '@/lib/skillTags';
import { Brain, Heart, Sparkle, Check } from 'lucide-react';

type Category = 'mental' | 'health' | 'spiritual';

type Props = {
  category: Category;
  value: string;
  onChange: (newValue: string) => void;
  compact?: boolean;
};

const CATEGORY_CONFIG: Record<Category, { icon: typeof Brain; label: string; color: string }> = {
  mental: { icon: Brain, label: 'Tinh Thần', color: 'text-purple-400' },
  health: { icon: Heart, label: 'Thể Chất', color: 'text-red-400' },
  spiritual: { icon: Sparkle, label: 'Tâm Linh', color: 'text-amber-400' },
};

const TAG_STYLE = 'px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all hover:scale-105 cursor-pointer';
const TAG_ACTIVE = 'bg-amber-500/25 border-amber-500/50 text-amber-200';
const TAG_IDLE = 'bg-white/5 border-white/10 text-gray-400/80 hover:border-amber-500/30';

function MentalTagSelector({ value, onChange, compact }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  const selected = parseMultiValue(value);
  const selectedSet = new Set(selected);

  const grouped = STATUS_TAGS.map(tag => {
    const subs = MENTAL_SUB_TAGS.filter(s => s.parent === tag.value);
    return { tag, subs };
  });

  return (
    <div className="space-y-2">
      {grouped.map(({ tag, subs }) => {
        const hasSelected = subs.some(s => selectedSet.has(s.value));
        return (
          <div key={tag.value} className={`rounded-lg border ${hasSelected ? tag.activeClass : 'border-white/5 bg-black/20'} p-2`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${hasSelected ? '' : 'text-gray-500'}`}>{tag.label}</span>
              {hasSelected && <Check className="w-3 h-3" />}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subs.map(sub => {
                const isActive = selectedSet.has(sub.value);
                return (
                  <button
                    key={sub.value}
                    type="button"
                    onClick={() => onChange(joinMultiValue(toggleTag(selected, sub.value)))}
                    className={`${TAG_STYLE} ${isActive ? TAG_ACTIVE : TAG_IDLE}`}
                  >
                    {sub.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {selected.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selected.map(tag => {
            const tagInfo = STATUS_TAGS.find(t => t.value === MENTAL_SUB_TAGS.find(s => s.value === tag)?.parent);
            return (
              <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tagInfo?.badgeClass ?? 'bg-white/10 text-gray-300'}`}>
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SimpleTagSelector({ tags, value, onChange }: { tags: string[]; value: string; onChange: (v: string) => void }) {
  const selected = parseMultiValue(value);
  const selectedSet = new Set(selected);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => {
          const isActive = selectedSet.has(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(joinMultiValue(toggleTag(selected, tag)))}
              className={`${TAG_STYLE} ${isActive ? TAG_ACTIVE : TAG_IDLE}`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selected.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatusTagSelector({ category, value, onChange, compact }: Props) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${config.color} flex-shrink-0`} />
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{config.label}</span>
      </div>
      {category === 'mental' ? (
        <MentalTagSelector value={value} onChange={onChange} compact={compact} />
      ) : category === 'health' ? (
        <SimpleTagSelector tags={HEALTH_SUB_TAGS} value={value} onChange={onChange} />
      ) : (
        <SimpleTagSelector tags={SPIRITUAL_SUB_TAGS} value={value} onChange={onChange} />
      )}
    </div>
  );
}
