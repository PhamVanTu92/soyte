import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formService } from '../services/formService';

/* ── Types ─────────────────────────────────────────────────────── */
export type QuestionType = 'likert' | 'single' | 'multi' | 'text' | 'textarea' | 'number' | 'date';

export interface FOption { id: string; option_key: string; label: string; order_index: number; }
export interface FQuestion {
  id: string;
  question_key: string;
  type: QuestionType;
  label: string;
  required: boolean;
  order_index: number;
  score_weight: number;
  options: FOption[];
}
export interface FSection  { id: string; title: string; order_index: number; questions: FQuestion[]; }
export interface FormDraft {
  name: string; description: string; org: string; badge: string;
  type: string; status: boolean; sections: FSection[];
}

/* ── Constants ──────────────────────────────────────────────────── */
let _uid = 0;
const uid = (p = 'id') => `${p}_${Date.now()}_${++_uid}`;

export const LIKERT_OPTIONS: FOption[] = [
  { id: uid('o'), option_key: '1', label: 'Rất không hài lòng',              order_index: 0 },
  { id: uid('o'), option_key: '2', label: 'Không hài lòng',                   order_index: 1 },
  { id: uid('o'), option_key: '3', label: 'Bình thường',                       order_index: 2 },
  { id: uid('o'), option_key: '4', label: 'Hài lòng',                          order_index: 3 },
  { id: uid('o'), option_key: '5', label: 'Rất hài lòng',                      order_index: 4 },
  { id: uid('o'), option_key: '0', label: 'Không sử dụng / Không có ý kiến',  order_index: 5 },
];

const makeLikert = (key: string, label: string): FQuestion => ({
  id: uid('q'), question_key: key, type: 'likert', label,
  required: false, order_index: 0, score_weight: 1,
  options: LIKERT_OPTIONS.map(o => ({ ...o, id: uid('o') })),
});

const blankSection = (): FSection => ({
  id: uid('s'), title: 'Phần mới', order_index: 0,
  questions: [{ id: uid('q'), question_key: 'Q1', type: 'text', label: 'Câu hỏi mới',
    required: false, order_index: 0, score_weight: 1, options: [] }],
});

/* ── Presets (BYT) ──────────────────────────────────────────────── */
const lk = (key: string, label: string) => makeLikert(key, label);

export const PRESETS: Record<string, () => FormDraft> = {
  blank: () => ({
    name: 'Biểu mẫu mới', description: '', org: '', badge: '',
    type: 'evaluate', status: true, sections: [blankSection()],
  }),

  noitru: () => ({
    name: 'Phiếu khảo sát sự hài lòng người bệnh nội trú',
    org: 'Bộ Y tế', badge: 'MẪU SỐ 1',
    description: 'Nhằm nâng cao chất lượng khám chữa bệnh, hướng tới sự hài lòng người bệnh. Ý kiến sẽ giúp bệnh viện từng bước cải tiến chất lượng.',
    type: 'evaluate', status: true,
    sections: [
      { id: uid('s'), title: 'A. Khả năng tiếp cận', order_index: 0, questions: [
        lk('A1','A1. Sơ đồ, biển báo chỉ dẫn đường đến các khoa phòng rõ ràng, dễ hiểu.'),
        lk('A2','A2. Các tòa nhà, cầu thang, thang máy được đánh số và hướng dẫn rõ ràng.'),
        lk('A3','A3. Lối đi trong bệnh viện, hành lang bằng phẳng, an toàn, dễ đi.'),
        lk('A4','A4. Thời gian chờ đợi thang máy, thủ tục khám chữa bệnh chấp nhận được.'),
        lk('A5','A5. Người bệnh hỏi và gọi được nhân viên y tế khi cần.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'B. Minh bạch thông tin và thủ tục', order_index: 1, questions: [
        lk('B1','B1. Quy trình, thủ tục hành chính rõ ràng, công khai, thuận tiện.'),
        lk('B2','B2. Giá dịch vụ y tế niêm yết công khai, dễ quan sát, dễ đọc.'),
        lk('B3','B3. Quy trình thanh toán viện phí khi ra viện rõ ràng, thuận tiện.'),
        lk('B4','B4. Được phổ biến nội quy và thông tin cần thiết khi nằm viện đầy đủ.'),
        lk('B5','B5. Được giải thích tình trạng bệnh, phương pháp và thời gian điều trị rõ ràng.'),
        lk('B6','B6. Được giải thích, tư vấn trước khi yêu cầu làm xét nghiệm, thăm dò.'),
        lk('B7','B7. Được công khai và cập nhật thông tin về dùng thuốc và chi phí điều trị.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'C. Cơ sở vật chất và phương tiện phục vụ', order_index: 2, questions: [
        lk('C1','C1. Buồng bệnh khang trang, sạch sẽ, có thiết bị điều chỉnh nhiệt độ phù hợp.'),
        lk('C2','C2. Buồng bệnh yên tĩnh, bảo đảm an toàn, an ninh, trật tự.'),
        lk('C3','C3. Giường bệnh, ga, gối đầy đủ cho mỗi người, chắc chắn, sử dụng tốt.'),
        lk('C4','C4. Được cung cấp quần áo đầy đủ, sạch sẽ.'),
        lk('C5','C5. Nhà vệ sinh, nhà tắm thuận tiện, sạch sẽ, sử dụng tốt.'),
        lk('C6','C6. Được cung cấp đầy đủ nước uống nóng, lạnh tại khoa điều trị.'),
        lk('C7','C7. Truy cập được mạng internet không dây (wifi) tại buồng bệnh.'),
        lk('C8','C8. Được bảo đảm sự riêng tư khi nằm viện (rèm che, vách ngăn).'),
        lk('C9','C9. Căng-tin bệnh viện phục vụ ăn uống và nhu cầu sinh hoạt đầy đủ.'),
        lk('C10','C10. Môi trường khuôn viên bệnh viện xanh, sạch, đẹp.'),
        lk('C11','C11. Được cung cấp phương tiện vận chuyển nội viện đầy đủ, kịp thời.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'D. Thái độ ứng xử và năng lực chuyên môn', order_index: 3, questions: [
        lk('D1','D1. Bác sỹ, điều dưỡng có lời nói, thái độ, giao tiếp đúng mực.'),
        lk('D2','D2. Nhân viên phục vụ có lời nói, thái độ, giao tiếp đúng mực.'),
        lk('D3','D3. Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ.'),
        lk('D4','D4. Bác sỹ, điều dưỡng hợp tác tốt và xử lý công việc thành thạo, kịp thời.'),
        lk('D5','D5. Được bác sỹ thăm khám, động viên tại phòng điều trị.'),
        lk('D6','D6. Được tư vấn chế độ ăn, vận động, theo dõi và phòng ngừa biến chứng.'),
        lk('D7','D7. Không bị nhân viên y tế gợi ý bồi dưỡng.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'E. Kết quả cung cấp dịch vụ', order_index: 4, questions: [
        lk('E1','E1. Thời gian chờ đợi khi khám, chữa bệnh tại bệnh viện.'),
        lk('E2','E2. Được cấp phát thuốc đúng giờ, hướng dẫn sử dụng và tác dụng phụ đầy đủ.'),
        lk('E3','E3. Được nhắc lịch tái khám và hướng dẫn chăm sóc tại nhà trước khi ra viện.'),
        lk('E4','E4. Trang thiết bị, vật tư y tế đầy đủ, hiện đại, đáp ứng nhu cầu KCB.'),
        lk('E5','E5. Kết quả điều trị đáp ứng được nguyện vọng.'),
        lk('E6','E6. Đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'G. Thông tin bổ sung', order_index: 5, questions: [
        { id: uid('q'), question_key: 'G1', type: 'number', label: 'G1. Bệnh viện đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà? (0-100%)',
          required: false, order_index: 0, score_weight: 1, options: [] },
        { id: uid('q'), question_key: 'G3', type: 'textarea', label: 'G2. Đối với các câu hỏi chưa hài lòng, lý do tại sao?',
          required: false, order_index: 1, score_weight: 1, options: [] },
        { id: uid('q'), question_key: 'G4', type: 'textarea', label: 'G3. Ý kiến/nhận xét khác giúp bệnh viện phục vụ người bệnh tốt hơn?',
          required: false, order_index: 2, score_weight: 1, options: [] },
      ]},
    ],
  }),

  ngoaitru: () => ({
    name: 'Phiếu khảo sát ý kiến người bệnh ngoại trú',
    org: 'Bộ Y tế', badge: 'MẪU SỐ 2',
    description: 'Nhằm nâng cao chất lượng khám chữa bệnh, hướng tới sự hài lòng người bệnh.',
    type: 'evaluate', status: true,
    sections: [
      { id: uid('s'), title: 'A. Khả năng tiếp cận', order_index: 0, questions: [
        lk('A1','A1. Biển báo, chỉ dẫn đường đến bệnh viện rõ ràng, dễ nhìn, dễ tìm.'),
        lk('A2','A2. Sơ đồ, biển báo chỉ dẫn đến các khoa phòng rõ ràng, dễ hiểu.'),
        lk('A3','A3. Các khối nhà, cầu thang được đánh số rõ ràng, dễ tìm.'),
        lk('A4','A4. Lối đi trong bệnh viện, hành lang bằng phẳng, dễ đi.'),
        lk('A5','A5. Có thể tìm hiểu thông tin và đăng ký khám qua điện thoại, website.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'B. Minh bạch thông tin và thủ tục', order_index: 1, questions: [
        lk('B1','B1. Quy trình khám bệnh niêm yết rõ ràng, công khai, dễ hiểu.'),
        lk('B2','B2. Quy trình, thủ tục khám bệnh đơn giản, thuận tiện.'),
        lk('B3','B3. Giá dịch vụ y tế niêm yết rõ ràng, công khai.'),
        lk('B4','B4. Nhân viên y tế tiếp đón, hướng dẫn niềm nở, tận tình.'),
        lk('B5','B5. Được xếp hàng theo thứ tự khi làm các thủ tục.'),
        lk('B6','B6. Thời gian chờ đợi làm thủ tục đăng ký khám.'),
        lk('B7','B7. Thời gian chờ tới lượt bác sỹ khám.'),
        lk('B8','B8. Thời gian được bác sỹ khám và tư vấn.'),
        lk('B9','B9. Thời gian chờ làm xét nghiệm, chiếu chụp.'),
        lk('B10','B10. Thời gian chờ nhận kết quả xét nghiệm, chiếu chụp.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'C. Cơ sở vật chất', order_index: 2, questions: [
        lk('C1','C1. Có phòng/sảnh chờ khám sạch sẽ, thoáng mát.'),
        lk('C2','C2. Phòng chờ có đủ ghế ngồi.'),
        lk('C3','C3. Phòng chờ có quạt/điều hòa hoạt động thường xuyên.'),
        lk('C4','C4. Nhà vệ sinh thuận tiện, sạch sẽ.'),
        lk('C5','C5. Môi trường khuôn viên bệnh viện xanh, sạch, đẹp.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'D. Thái độ ứng xử và năng lực chuyên môn', order_index: 3, questions: [
        lk('D1','D1. Nhân viên y tế có lời nói, thái độ đúng mực.'),
        lk('D2','D2. Nhân viên phục vụ có lời nói, thái độ đúng mực.'),
        lk('D3','D3. Được nhân viên y tế tôn trọng, đối xử công bằng.'),
        lk('D4','D4. Năng lực chuyên môn của bác sỹ, điều dưỡng đáp ứng mong đợi.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'E. Kết quả cung cấp dịch vụ', order_index: 4, questions: [
        lk('E1','E1. Kết quả khám bệnh đã đáp ứng được nguyện vọng.'),
        lk('E2','E2. Các hóa đơn, phiếu thu, đơn thuốc, kết quả được cung cấp đầy đủ, rõ ràng.'),
        lk('E3','E3. Đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế.'),
        lk('E4','E4. Đánh giá mức độ hài lòng về giá cả dịch vụ y tế.'),
      ].map((q,i)=>({...q,order_index:i}))},
      { id: uid('s'), title: 'G. Thông tin bổ sung', order_index: 5, questions: [
        { id: uid('q'), question_key: 'G1', type: 'number', label: 'G1. Bệnh viện đáp ứng được bao nhiêu % so với mong đợi?',
          required: false, order_index: 0, score_weight: 1, options: [] },
        { id: uid('q'), question_key: 'G2', type: 'textarea', label: 'G2. Ý kiến/nhận xét khác?',
          required: false, order_index: 1, score_weight: 1, options: [] },
      ]},
    ],
  }),
};

/* ── Default options for question types ─────────────────────────── */
const defaultOptions = (type: QuestionType): FOption[] => {
  if (type === 'likert') return LIKERT_OPTIONS.map(o => ({ ...o, id: uid('o') }));
  if (type === 'single' || type === 'multi') return [
    { id: uid('o'), option_key: '1', label: 'Tùy chọn 1', order_index: 0 },
    { id: uid('o'), option_key: '2', label: 'Tùy chọn 2', order_index: 1 },
  ];
  return [];
};

/* ── Normalise API response → FormDraft ─────────────────────────── */
const normaliseDraft = (apiData: any): FormDraft => ({
  name:        apiData.name        ?? '',
  description: apiData.description ?? '',
  org:         apiData.org         ?? '',
  badge:       apiData.badge       ?? '',
  type:        apiData.type        ?? 'evaluate',
  status:      apiData.status === 'active' || apiData.status === true,
  sections: (apiData.sections ?? []).map((s: any, si: number) => ({
    id:          uid('s'),
    title:       s.title       ?? '',
    order_index: s.order_index ?? si,
    questions:   (s.questions ?? []).map((q: any, qi: number) => ({
      id:           uid('q'),
      question_key: q.question_key ?? `Q${qi + 1}`,
      type:         q.type         ?? 'text',
      label:        q.label        ?? '',
      required:     Boolean(q.required),
      order_index:  q.order_index  ?? qi,
      score_weight: parseFloat(q.score_weight ?? 1),
      options:      (q.options ?? []).map((o: any, oi: number) => ({
        id:          uid('o'),
        option_key:  String(o.option_key ?? o.value ?? oi + 1),
        label:       o.label ?? '',
        order_index: o.order_index ?? oi,
      })),
    })),
  })),
});

/* ── Hook ────────────────────────────────────────────────────────── */
export const useFormBuilder = (
  id: string | undefined,
  type: string | undefined,
  toastRef: React.RefObject<any>,
) => {
  const navigate = useNavigate();
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [draft,    setDraft]    = useState<FormDraft>(PRESETS.blank());
  const [preview,  setPreview]  = useState(false);

  /* fetch existing */
  const fetchForm = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    try {
      const res = await formService.fetchFormById(id);
      const data = res?.data ?? res;
      if (data) setDraft(normaliseDraft(data));
    } catch (e) {
      toastRef.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải biểu mẫu' });
    } finally { setFetching(false); }
  }, [id]);

  useEffect(() => { fetchForm(); }, [fetchForm]);

  /* ── Draft field setters ────────────────────────────── */
  const setField = (field: keyof FormDraft, val: any) =>
    setDraft(d => ({ ...d, [field]: val }));

  /* ── Load preset ────────────────────────────────────── */
  const loadPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key]();
    setDraft({ ...p, type: type ?? p.type });
  };

  /* ── Section CRUD ───────────────────────────────────── */
  const addSection = () => setDraft(d => ({
    ...d, sections: [...d.sections,
      { id: uid('s'), title: `Phần ${d.sections.length + 1}`, order_index: d.sections.length, questions: [] }],
  }));

  const updateSection = (sid: string, field: 'title', val: string) =>
    setDraft(d => ({ ...d, sections: d.sections.map(s => s.id === sid ? { ...s, [field]: val } : s) }));

  const removeSection = (sid: string) =>
    setDraft(d => ({ ...d, sections: d.sections.filter(s => s.id !== sid) }));

  const moveSection = (sid: string, dir: -1 | 1) => setDraft(d => {
    const arr = [...d.sections];
    const i = arr.findIndex(s => s.id === sid);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return d;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...d, sections: arr.map((s, idx) => ({ ...s, order_index: idx })) };
  });

  /* ── Question CRUD ──────────────────────────────────── */
  const addQuestion = (sid: string) => setDraft(d => ({
    ...d, sections: d.sections.map(s => {
      if (s.id !== sid) return s;
      const qi = s.questions.length;
      return { ...s, questions: [...s.questions, {
        id: uid('q'), question_key: `Q${qi + 1}`, type: 'text' as QuestionType,
        label: 'Câu hỏi mới', required: false, order_index: qi, score_weight: 1, options: [],
      }]};
    }),
  }));

  const updateQuestion = (sid: string, qid: string, field: keyof FQuestion, val: any) =>
    setDraft(d => ({ ...d, sections: d.sections.map(s => {
      if (s.id !== sid) return s;
      return { ...s, questions: s.questions.map(q => {
        if (q.id !== qid) return q;
        const updated = { ...q, [field]: val };
        // Auto-reset options when type changes
        if (field === 'type') updated.options = defaultOptions(val as QuestionType);
        return updated;
      })};
    })}));

  const removeQuestion = (sid: string, qid: string) =>
    setDraft(d => ({ ...d, sections: d.sections.map(s =>
      s.id !== sid ? s : { ...s, questions: s.questions.filter(q => q.id !== qid) }
    )}));

  const moveQuestion = (sid: string, qid: string, dir: -1 | 1) => setDraft(d => ({
    ...d, sections: d.sections.map(s => {
      if (s.id !== sid) return s;
      const arr = [...s.questions];
      const i = arr.findIndex(q => q.id === qid);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, questions: arr.map((q, idx) => ({ ...q, order_index: idx })) };
    }),
  }));

  /* ── Option CRUD ────────────────────────────────────── */
  const addOption = (sid: string, qid: string) => setDraft(d => ({
    ...d, sections: d.sections.map(s => {
      if (s.id !== sid) return s;
      return { ...s, questions: s.questions.map(q => {
        if (q.id !== qid) return q;
        const oi = q.options.length;
        return { ...q, options: [...q.options,
          { id: uid('o'), option_key: String(oi + 1), label: `Tùy chọn ${oi + 1}`, order_index: oi }]};
      })};
    }),
  }));

  const updateOption = (sid: string, qid: string, oid: string, field: 'label' | 'option_key', val: string) =>
    setDraft(d => ({ ...d, sections: d.sections.map(s => {
      if (s.id !== sid) return s;
      return { ...s, questions: s.questions.map(q => {
        if (q.id !== qid) return q;
        return { ...q, options: q.options.map(o => o.id === oid ? { ...o, [field]: val } : o) };
      })};
    })}));

  const removeOption = (sid: string, qid: string, oid: string) =>
    setDraft(d => ({ ...d, sections: d.sections.map(s => {
      if (s.id !== sid) return s;
      return { ...s, questions: s.questions.map(q =>
        q.id !== qid ? q : { ...q, options: q.options.filter(o => o.id !== oid) }
      )};
    })}));

  /* ── Save ───────────────────────────────────────────── */
  const save = async () => {
    if (!draft.name.trim()) {
      toastRef.current?.show({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng nhập tên biểu mẫu' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name:        draft.name.trim(),
        description: draft.description,
        org:         draft.org,
        badge:       draft.badge,
        type:        type ?? draft.type,
        status:      draft.status ? 'active' : 'inactive',
        sections: draft.sections.map((s, si) => ({
          title:       s.title,
          order_index: si,
          questions: s.questions.map((q, qi) => ({
            question_key: q.question_key || `Q${qi + 1}`,
            type:         q.type,
            label:        q.label,
            required:     q.required,
            order_index:  qi,
            score_weight: q.score_weight,
            options: q.options.map((o, oi) => ({
              option_key:  o.option_key,
              label:       o.label,
              order_index: oi,
            })),
          })),
        })),
      };
      if (id) await formService.updateForm(id, payload);
      else    await formService.createForm(payload);
      toastRef.current?.show({ severity: 'success', summary: 'Thành công', detail: 'Đã lưu biểu mẫu' });
      setTimeout(() => navigate(`/admin/templates/${type ?? draft.type}`), 900);
    } catch (e) {
      toastRef.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể lưu biểu mẫu' });
    } finally { setLoading(false); }
  };

  /* ── Stats helpers ──────────────────────────────────── */
  const sectionCount  = draft.sections.length;
  const questionCount = draft.sections.reduce((a, s) => a + s.questions.length, 0);

  return {
    draft, setField, loading, fetching, preview, setPreview,
    loadPreset,
    addSection, updateSection, removeSection, moveSection,
    addQuestion, updateQuestion, removeQuestion, moveQuestion,
    addOption, updateOption, removeOption,
    save, sectionCount, questionCount,
  };
};
