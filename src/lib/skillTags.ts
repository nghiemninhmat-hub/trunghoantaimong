export type MentalTag = {
  value: string;
  label: string;
  color: string;
  badgeClass: string;
  activeClass: string;
  idleClass: string;
};

export const STATUS_TAGS: MentalTag[] = [
  { value: 'Bình Thường', label: 'Thẻ Xanh Lá', color: 'green', badgeClass: 'bg-emerald-500/20 text-emerald-300', activeClass: 'bg-emerald-500/30 border-emerald-500/50 text-emerald-200', idleClass: 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400/70' },
  { value: 'Ảnh hưởng nhẹ', label: 'Thẻ Vàng', color: 'yellow', badgeClass: 'bg-yellow-500/20 text-yellow-300', activeClass: 'bg-yellow-500/30 border-yellow-500/50 text-yellow-200', idleClass: 'bg-yellow-500/5 border-yellow-500/15 text-yellow-400/70' },
  { value: 'Nghiêm trọng', label: 'Thẻ Đỏ Nhạt', color: 'red-light', badgeClass: 'bg-red-400/20 text-red-300', activeClass: 'bg-red-400/30 border-red-400/50 text-red-200', idleClass: 'bg-red-400/5 border-red-400/15 text-red-400/70' },
  { value: 'Cực kỳ nghiêm trọng', label: 'Thẻ Đỏ Đậm', color: 'red-dark', badgeClass: 'bg-red-600/20 text-red-400', activeClass: 'bg-red-600/30 border-red-600/50 text-red-300', idleClass: 'bg-red-600/5 border-red-600/15 text-red-500/70' },
  { value: 'Suy kiệt', label: 'Thẻ Tím Nhạt', color: 'purple-light', badgeClass: 'bg-purple-400/20 text-purple-300', activeClass: 'bg-purple-400/30 border-purple-400/50 text-purple-200', idleClass: 'bg-purple-400/5 border-purple-400/15 text-purple-400/70' },
  { value: 'Ngưỡng sinh tử', label: 'Thẻ Tím Đậm', color: 'purple-dark', badgeClass: 'bg-purple-700/20 text-purple-400', activeClass: 'bg-purple-700/30 border-purple-700/50 text-purple-300', idleClass: 'bg-purple-700/5 border-purple-700/15 text-purple-500/70' },
];

export type MentalSubTag = {
  value: string;
  parent: string;
};

export const MENTAL_SUB_TAGS: MentalSubTag[] = [
  // Xanh lá
  { value: 'Khỏe mạnh', parent: 'Bình Thường' },
  // Vàng
  { value: 'Bất an', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Nóng nảy', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Mơ hồ', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Không thể tập trung', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Căng thẳng', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Thất thần', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Nhạy cảm với các giác quan', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Rối trí', parent: 'Ảnh hưởng nhẹ' },
  // Đỏ nhạt (Hồng nhạt)
  { value: 'Lãnh cảm', parent: 'Nghiêm trọng' },
  { value: 'Quá tải giác quan', parent: 'Nghiêm trọng' },
  { value: 'Suy sụp', parent: 'Nghiêm trọng' },
  { value: 'Hoảng loạn', parent: 'Nghiêm trọng' },
  { value: 'Ám ảnh', parent: 'Nghiêm trọng' },
  { value: 'Mê man', parent: 'Nghiêm trọng' },
  { value: 'Mộng du', parent: 'Nghiêm trọng' },
  { value: 'Tâm trí có dấu hiệu hoen ố', parent: 'Nghiêm trọng' },
  // Đỏ đậm
  { value: 'Ảo giác', parent: 'Cực kỳ nghiêm trọng' },
  { value: 'Thần trí lúc tỉnh lúc mê', parent: 'Cực kỳ nghiêm trọng' },
  { value: 'Kinh hãi', parent: 'Cực kỳ nghiêm trọng' },
  { value: 'Ký ức hỗn loạn', parent: 'Cực kỳ nghiêm trọng' },
  { value: 'Tâm trí hoen ố nặng', parent: 'Cực kỳ nghiêm trọng' },
  // Tím nhạt
  { value: 'Mất lòng tin', parent: 'Suy kiệt' },
  { value: 'Kiệt quệ', parent: 'Suy kiệt' },
  { value: 'Mất phương hướng', parent: 'Suy kiệt' },
  { value: 'Vô cảm', parent: 'Suy kiệt' },
  // Tím đậm
  { value: 'Mất ý thức', parent: 'Ngưỡng sinh tử' },
  { value: 'Hoang tưởng', parent: 'Ngưỡng sinh tử' },
  { value: 'Rối loạn nhận thức', parent: 'Ngưỡng sinh tử' },
  { value: 'Tinh thần tan rã', parent: 'Ngưỡng sinh tử' },
  { value: 'Cuồng loạn', parent: 'Ngưỡng sinh tử' },
];

export const HEALTH_SUB_TAGS: MentalSubTag[] = [
  // Xanh lá
  { value: 'Khỏe mạnh', parent: 'Bình Thường' },
  // Vàng
  { value: 'Vết rách nhỏ trên da', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Bỏng rát', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Mất một phần thị lực', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Khó thở', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Hoa mắt, choáng váng', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Đau nhức', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Đau đầu', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Ù tai', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Buồn nôn', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Bong gân', parent: 'Ảnh hưởng nhẹ' },
  { value: 'Tê buốt kinh mạch', parent: 'Ảnh hưởng nhẹ' },
  // Đỏ nhạt
  { value: 'Gãy tay', parent: 'Nghiêm trọng' },
  { value: 'Gãy chân', parent: 'Nghiêm trọng' },
  { value: 'Suy nhược', parent: 'Nghiêm trọng' },
  { value: 'Mất máu', parent: 'Nghiêm trọng' },
  { value: 'Trật khớp', parent: 'Nghiêm trọng' },
  { value: 'Suy giảm nặng các giác quan', parent: 'Nghiêm trọng' },
  { value: 'Thị lực suy giảm mạnh', parent: 'Nghiêm trọng' },
  // Đỏ đậm
  { value: 'Xuất huyết nặng', parent: 'Cực kỳ nghiêm trọng' },
  { value: 'Bỏng nặng', parent: 'Cực kỳ nghiêm trọng' },
  { value: 'Suy hô hấp', parent: 'Cực kỳ nghiêm trọng' },
  // Tím nhạt
  { value: 'Ngất', parent: 'Suy kiệt' },
  { value: 'Nhiễm độc', parent: 'Suy kiệt' },
  { value: 'Kiệt sức', parent: 'Suy kiệt' },
  // Tím đậm
  { value: 'Mất thính giác', parent: 'Ngưỡng sinh tử' },
  { value: 'Mù lòa', parent: 'Ngưỡng sinh tử' },
  { value: 'Liệt chi', parent: 'Ngưỡng sinh tử' },
  { value: 'Tê liệt', parent: 'Ngưỡng sinh tử' },
  { value: 'Các giác quan suy kiệt', parent: 'Ngưỡng sinh tử' },
  { value: 'Hấp hối', parent: 'Ngưỡng sinh tử' },
];

export const SPIRITUAL_SUB_TAGS: MentalSubTag[] = [
  // Xanh lá
  { value: 'Thanh khiết', parent: 'Bình Thường' },
  // Vàng
  { value: 'Bất tịnh', parent: 'Ảnh hưởng nhẹ' },
  // Hồng nhạt (mapped to Nghiêm trọng severity)
  { value: 'Âm khí xâm nhập', parent: 'Nghiêm trọng' },
  { value: 'Tà khí nhập thể', parent: 'Nghiêm trọng' },
  { value: 'Suy giảm khả năng phân biệt âm dương', parent: 'Nghiêm trọng' },
  // Đỏ đậm
  { value: 'Oán khí quấn thân', parent: 'Cực kỳ nghiêm trọng' },
  { value: 'Chấp niệm ăn mòn', parent: 'Cực kỳ nghiêm trọng' },
  { value: 'Mất phách', parent: 'Cực kỳ nghiêm trọng' },
  // Tím đậm
  { value: 'Quỷ khí bám thân', parent: 'Ngưỡng sinh tử' },
  { value: 'Dính lời nguyền', parent: 'Ngưỡng sinh tử' },
  { value: 'Quỷ ám', parent: 'Ngưỡng sinh tử' },
];

export const MENTAL_TAG_DESCRIPTIONS: Record<string, string> = {
  'Bình Thường': 'Trạng thái khỏe mạnh.',
  'Ảnh hưởng nhẹ': 'Trạng thái bị ảnh hưởng nhẹ — có thể hoạt động, phát huy năng lực bình thường hoặc hạn chế ít.',
  'Nghiêm trọng': 'Trạng thái ảnh hưởng nghiêm trọng — có thể gắng gượng hoạt động, năng lực không phát huy toàn bộ, cần cứu chữa kịp thời, cần người hỗ trợ lúc di chuyển.',
  'Cực kỳ nghiêm trọng': 'Trạng thái ảnh hưởng cực kỳ nghiêm trọng — có thể gắng gượng nếu chỉ ảnh hưởng 1-2 bộ phận/giác quan nhưng cần người giúp đỡ, bảo vệ. Cần chữa trị ngay lập tức.',
  'Suy kiệt': 'Trạng thái gần như mất nhận thức, suy kiệt, có thể cố gắng gắng gượng nhưng không di chuyển nhiều. Đã qua thời khắc vàng để chữa trị.',
  'Ngưỡng sinh tử': 'Trạng thái gần như không thể phục hồi, mất khả năng kiểm soát, nhân vật không còn khả năng hoạt động, nhịp sống mong manh.',
};

export function parseMultiValue(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  return raw.split(/[,;]+/).map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

export function joinMultiValue(tags: string[]): string {
  return tags.join(', ');
}

export function toggleTag(currentTags: string[], tag: string): string[] {
  return currentTags.includes(tag)
    ? currentTags.filter(t => t !== tag)
    : [...currentTags, tag];
}

export type SkillFormData = {
  name: string;
  usage_detail: string;
  effect: string;
  tradeoff: string;
  cong_duc_cost: number;
  am_duc_cost: number;
  duration: string;
  mental_effect: string;
  mental_duration: number;
  health_effect: string;
  health_duration: number;
  spiritual_effect: string;
  spiritual_duration: number;
  ghost_level_effect: string;
  destruction_percent: number;
};

export const emptySkill: SkillFormData = {
  name: '',
  usage_detail: '',
  effect: '',
  tradeoff: '',
  cong_duc_cost: 0,
  am_duc_cost: 0,
  duration: '',
  mental_effect: '',
  mental_duration: 0,
  health_effect: '',
  health_duration: 0,
  spiritual_effect: '',
  spiritual_duration: 0,
  ghost_level_effect: '',
  destruction_percent: 0,
};

export const SKILL_FIELDS: { key: keyof SkillFormData; label: string; type: 'text' | 'textarea' | 'number' | 'multitag'; placeholder?: string; max?: number; category?: 'mental' | 'health' | 'spiritual' }[] = [
  { key: 'name', label: 'Tên kỹ năng', type: 'text', placeholder: 'Tên kỹ năng...' },
  { key: 'usage_detail', label: 'Chi tiết cách sử dụng', type: 'textarea', placeholder: 'Mô tả cách sử dụng...' },
  { key: 'effect', label: 'Hiệu quả', type: 'textarea', placeholder: 'Mô tả hiệu quả...' },
  { key: 'tradeoff', label: 'Đánh đổi', type: 'textarea', placeholder: 'vd: không thể sử dụng trong 2-3-4 dị sự liên tiếp...' },
  { key: 'cong_duc_cost', label: 'Tiêu hao công đức', type: 'number' },
  { key: 'am_duc_cost', label: 'Tiêu hao âm đức', type: 'number' },
  { key: 'duration', label: 'Thời gian duy trì', type: 'text', placeholder: 'vd: 3 dị sự, 1 ngày...' },
  { key: 'mental_effect', label: 'Ảnh hưởng tinh thần', type: 'multitag', category: 'mental' },
  { key: 'mental_duration', label: 'Thời gian ảnh hưởng tinh thần (tối đa 50)', type: 'number', max: 50 },
  { key: 'health_effect', label: 'Ảnh hưởng sức khỏe', type: 'multitag', category: 'health' },
  { key: 'health_duration', label: 'Thời gian ảnh hưởng sức khỏe (tối đa 50)', type: 'number', max: 50 },
  { key: 'spiritual_effect', label: 'Ảnh hưởng tâm linh', type: 'multitag', category: 'spiritual' },
  { key: 'spiritual_duration', label: 'Thời gian ảnh hưởng tâm linh (tối đa 50)', type: 'number', max: 50 },
  { key: 'ghost_level_effect', label: 'Ảnh hưởng lên từng cấp quỷ', type: 'textarea', placeholder: 'vd: Quỷ cấp 1: 100%, cấp 2: 80%...' },
  { key: 'destruction_percent', label: 'Gây bao nhiêu % tiêu diệt', type: 'number', max: 100 },
];
