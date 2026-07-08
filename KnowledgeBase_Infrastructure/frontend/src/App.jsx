import React, { useState } from 'react';
import { Send, FileText, Plus, Headphones, Sparkles, BookOpen, Search, Menu, ChevronLeft, Clock, Database, MessageSquare, Settings, ChevronDown } from 'lucide-react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      type: 'greeting',
      content: 'مرحباً بك في منصة جنى القابضة للمعرفة (Jana-LM). يمكنك تحديد المستندات من القائمة الجانبية وطرح أي أسئلة حول العقود، الفواتير، أو ملفات الموارد البشرية الخاصة بك.'
    }
  ]);

  const sources = [
    { id: 1, title: 'عقد صيانة أسطول السيارات 2025', desc: 'تم الرفع اليوم', status: 'production', active: true },
    { id: 2, title: 'فواتير توريد الصلب - الربع الأول', desc: 'تم الرفع أمس', status: 'production', active: true },
    { id: 3, title: 'سياسة الموارد البشرية المحدثة', desc: 'تم الرفع منذ أسبوع', status: 'development', active: false },
    { id: 4, title: 'عقد تأجير المقر الرئيسي', desc: 'تم الرفع منذ ٣ أيام', status: 'integrated', active: false },
    { id: 5, title: 'كشف رواتب الموظفين - يونيو', desc: 'تم الرفع منذ يومين', status: 'mock', active: false },
  ];

  const statusConfig = {
    mock: { label: 'نموذج', className: 'badge-mock' },
    planned: { label: 'مخطط', className: 'badge-planned' },
    development: { label: 'قيد التطوير', className: 'badge-development' },
    integrated: { label: 'مدمج', className: 'badge-integrated' },
    production: { label: 'جاهز', className: 'badge-production' },
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setMessages([...messages, { role: 'user', content: query }]);
    setQuery('');

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
    <div className="app">
      {/* SHELL HEADER */}
      <header className="shell-header">
        <div className="shell-header-left">
          <button className="shell-ghost-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
          <div className="shell-brand">
            <div className="shell-brand-icon">
              <BookOpen size={18} />
            </div>
            <span className="shell-brand-name">Jana-LM</span>
            <span className="shell-brand-badge">Command Center</span>
          </div>
        </div>
        <div className="shell-header-center">
          <div className="shell-search">
            <Search size={16} />
            <input type="text" placeholder="بحث في المصادر والمحادثات..." />
          </div>
        </div>
        <div className="shell-header-right">
          <button className="shell-ghost-btn">
            <Settings size={20} />
          </button>
          <div className="shell-status">
            <span className="shell-status-dot"></span>
            <span className="shell-status-text">متصل</span>
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* SHELL SIDEBAR */}
        <aside className={`shell-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <Database size={16} />
              {!sidebarCollapsed && <span>المصادر المحددة</span>}
            </div>
          </div>

          <div className="sidebar-sources">
            {sources.map(source => (
              <div key={source.id} className={`sidebar-source-item ${source.active ? 'active' : ''}`}>
                <div className="sidebar-source-icon">
                  <FileText size={18} />
                </div>
                {!sidebarCollapsed && (
                  <>
                    <div className="sidebar-source-content">
                      <span className="sidebar-source-title">{source.title}</span>
                      <div className="sidebar-source-meta">
                        <span className="sidebar-source-desc">{source.desc}</span>
                        <span className={`status-badge ${statusConfig[source.status].className}`}>
                          {statusConfig[source.status].label}
                        </span>
                      </div>
                    </div>
                    <div className={`sidebar-source-check ${source.active ? 'checked' : ''}`} />
                  </>
                )}
              </div>
            ))}
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="sidebar-section">
                <button className="sidebar-add-btn">
                  <Plus size={16} />
                  إضافة مصدر جديد
                </button>
              </div>

              <div className="sidebar-footer">
                <div className="audio-card">
                  <Sparkles size={20} color="var(--primary)" />
                  <div className="audio-card-content">
                    <h4>نظرة عامة صوتية</h4>
                    <p>استمع إلى ملخص ذكي للمصادر المحددة</p>
                  </div>
                  <button className="audio-btn">
                    <Headphones size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="workspace">
          {/* Chat messages */}
          <div className="chat-messages">
            <div className="chat-scroll">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  {msg.type === 'greeting' && (
                    <div className="message-card greeting-card">
                      <div className="message-avatar">
                        <BookOpen size={18} />
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="message-card user-card">
                      <p>{msg.content}</p>
                    </div>
                  )}
                  {msg.type === 'complex' && (
                    <div className="message-card ai-card">
                      <div className="message-avatar">
                        <Sparkles size={18} />
                      </div>
                      <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>{msg.content}</p>
                      {msg.citations && (
                        <div className="citations">
                          <span className="citations-label">المصادر:</span>
                          <div className="citations-list">
                            {msg.citations.map((cite, i) => (
                              <div key={i} className="citation-chip">
                                <FileText size={14} />
                                {cite.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Input area */}
          <div className="input-area">
            <div className="input-section">
              <form className="input-bar" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="ابحث في المصادر الخاصة بك أو اطلب تلخيصاً..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="send-btn">
                  <Send size={18} />
                </button>
              </form>
              <div className="suggested">
                <button className="suggested-chip" onClick={() => setQuery('ما هي البنود الرئيسية في عقد صيانة الأسطول؟')}>
                  <Clock size={14} />
                  البنود الرئيسية في عقد الصيانة
                </button>
                <button className="suggested-chip" onClick={() => setQuery('قم بتلخيص المبالغ المدفوعة في الربع الأول')}>
                  <MessageSquare size={14} />
                  تلخيص المبالغ المدفوعة
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
