import React, { useState } from 'react';
import { Send, FileText, Plus, Headphones, Sparkles, BookOpen } from 'lucide-react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      type: 'greeting',
      content: 'مرحباً بك في منصة جنى القابضة للمعرفة (Jana-LM). يمكنك تحديد المستندات من القائمة الجانبية وطرح أي أسئلة حول العقود، الفواتير، أو ملفات الموارد البشرية الخاصة بك.'
    }
  ]);

  const sources = [
    { id: 1, title: 'عقد صيانة أسطول السيارات 2025', desc: 'تم الرفع اليوم', active: true },
    { id: 2, title: 'فواتير توريد الصلب - الربع الأول', desc: 'تم الرفع أمس', active: true },
    { id: 3, title: 'سياسة الموارد البشرية المحدثة', desc: 'تم الرفع منذ أسبوع', active: false },
  ];

  const handleSend = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setMessages([...messages, { role: 'user', content: query }]);
    setQuery('');

    // Simulate AI synthesis response based on active sources
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          type: 'complex',
          content: "بناءً على المستندات المحددة (عقد صيانة الأسطول وفواتير الصلب):\n\nبلغت التكلفة الإجمالية لصيانة الأسطول في الربع الأول 95,000 ريال سعودي، بينما بلغت قيمة توريد الصلب 142,000 ريال سعودي. يرجى ملاحظة أن عقد الأسطول يتضمن بند تجديد تلقائي في حال عدم الإلغاء قبل 30 يوماً من انتهائه.",
          citations: [
            { id: "1", name: "عقد صيانة الأسطول (صفحة 4)" },
            { id: "2", name: "فاتورة توريد الصلب #8843" }
          ]
        }
      ]);
    }, 1200);
  };

  return (
    <div className="app-wrapper">
      {/* SIDEBAR - Sources */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={24} />
          </div>
          <h1>جنى القابضة</h1>
        </div>

        <div className="sources-header">
          <h2>المصادر المحددة</h2>
          <button className="add-source-btn" title="إضافة مصدر جديد">
            <Plus size={20} />
          </button>
        </div>

        <div className="source-list">
          {sources.map(source => (
            <div key={source.id} className={`source-item ${source.active ? 'active' : ''}`}>
              <FileText size={24} color={source.active ? "#FFA500" : "rgba(255,255,255,0.6)"} />
              <div className="source-item-content">
                <span className="source-item-title">{source.title}</span>
                <span className="source-item-desc">{source.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="audio-overview-card">
          <Sparkles size={24} color="#FFA500" style={{ marginBottom: '10px' }} />
          <h3>نظرة عامة صوتية</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
            استمع إلى ملخص صوتي باللغة العربية للمصادر المحددة (بودكاست ذكي).
          </p>
          <button className="audio-btn">
            <Headphones size={20} />
            توليد المقطع الصوتي
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="main-area">
        <header className="chat-header">
          <div className="chat-title">المحادثة مع المصادر</div>
        </header>

        <div className="chat-history">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.type === 'greeting' && (
                <div className="answer-block">
                  <p>{msg.content}</p>
                </div>
              )}
              {msg.role === 'user' && (
                <p>{msg.content}</p>
              )}
              {msg.type === 'complex' && (
                <>
                  <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>{msg.content}</p>
                  {msg.citations && (
                    <div className="citations-pill-container">
                      {msg.citations.map((cite, i) => (
                         <div key={i} className="citation-pill">
                           <FileText size={14} />
                           {cite.name}
                         </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="input-container">
          <form className="input-box" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="ابحث في المصادر الخاصة بك أو اطلب تلخيصاً..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              dir="rtl"
            />
            <button type="submit" className="send-btn">
              {/* Rotate Send icon for RTL */}
              <Send size={20} style={{ transform: 'rotate(180deg)', marginLeft: '-4px' }} />
            </button>
          </form>

          <div className="suggested-questions">
            <button className="suggested-btn" onClick={() => setQuery('ما هي البنود الرئيسية في عقد صيانة الأسطول؟')}>
              ما هي البنود الرئيسية في عقد الصيانة؟
            </button>
            <button className="suggested-btn" onClick={() => setQuery('قم بتلخيص المبالغ المدفوعة في الربع الأول')}>
              تلخيص المبالغ المدفوعة
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
