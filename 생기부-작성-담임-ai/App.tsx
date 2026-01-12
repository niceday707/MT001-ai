import React, { useState } from 'react';
import { 
  StudentProfile, 
  ActivityData, 
  InputMode, 
  RecordSection, 
  StudentField, 
  SectionInputData,
  GeneratedRecord,
  GenerationStatus
} from './types';
import FileUploader from './components/FileUploader';
import ResultCard from './components/ResultCard';
import { generateSectionContent } from './services/geminiService';

const initialSectionData: SectionInputData = { text: '', files: [], memo: '' };

const App: React.FC = () => {
  // --- State ---
  const [step, setStep] = useState<'input' | 'result'>('input');
  
  const [student, setStudent] = useState<StudentProfile>({
    name: '',
    field: StudentField.HUMANITIES,
    careerPath: ''
  });

  const [inputMode, setInputMode] = useState<InputMode>(InputMode.INTEGRATED);

  const [activityData, setActivityData] = useState<ActivityData>({
    mode: InputMode.INTEGRATED,
    integrated: { ...initialSectionData },
    sectional: {
      [RecordSection.AUTONOMOUS]: { ...initialSectionData },
      [RecordSection.CAREER]: { ...initialSectionData },
      [RecordSection.BEHAVIORAL]: { ...initialSectionData },
    }
  });

  const [generatedResults, setGeneratedResults] = useState<GeneratedRecord>({
    [RecordSection.AUTONOMOUS]: '',
    [RecordSection.CAREER]: '',
    [RecordSection.BEHAVIORAL]: '',
  });

  const [isGenerating, setIsGenerating] = useState<GenerationStatus>({
    [RecordSection.AUTONOMOUS]: false,
    [RecordSection.CAREER]: false,
    [RecordSection.BEHAVIORAL]: false,
  });

  const [activeTab, setActiveTab] = useState<RecordSection>(RecordSection.AUTONOMOUS);

  // --- Handlers ---

  const handleStudentChange = (key: keyof StudentProfile, value: string) => {
    setStudent(prev => ({ ...prev, [key]: value }));
  };

  const handleIntegratedChange = (key: keyof SectionInputData, value: any) => {
    setActivityData(prev => ({
      ...prev,
      integrated: { ...prev.integrated, [key]: value }
    }));
  };

  const handleSectionalChange = (section: RecordSection, key: keyof SectionInputData, value: any) => {
    setActivityData(prev => ({
      ...prev,
      sectional: {
        ...prev.sectional,
        [section]: { ...prev.sectional[section], [key]: value }
      }
    }));
  };

  const handleGenerate = async (section: RecordSection) => {
    if (!student.name) {
      alert("학생 이름을 입력해주세요.");
      return;
    }
    
    setIsGenerating(prev => ({ ...prev, [section]: true }));

    try {
      // Determine input data source based on mode
      const sourceData = inputMode === InputMode.SECTIONAL 
        ? activityData.sectional[section]
        : activityData.integrated; // Use integrated input for all, providing specific instructions
      
      const integratedContext = inputMode === InputMode.INTEGRATED ? activityData.integrated.text : undefined;

      const content = await generateSectionContent(
        section, 
        student, 
        sourceData, 
        inputMode, 
        integratedContext
      );
      
      setGeneratedResults(prev => ({ ...prev, [section]: content }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setIsGenerating(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleGenerateAll = async () => {
    if (!student.name) {
      alert("학생 이름을 입력해주세요.");
      return;
    }
    setStep('result');
    await Promise.all([
      handleGenerate(RecordSection.AUTONOMOUS),
      handleGenerate(RecordSection.CAREER),
      handleGenerate(RecordSection.BEHAVIORAL)
    ]);
  };

  const handleDownloadWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>생기부-${student.name}</title></head>
      <body>
        <h1>${student.name} - 학교생활기록부 기초자료</h1>
        <h2>1. 자율활동 특기사항</h2>
        <p>${generatedResults[RecordSection.AUTONOMOUS].replace(/\n/g, '<br>')}</p>
        <hr>
        <h2>2. 진로활동 특기사항</h2>
        <p>${generatedResults[RecordSection.CAREER].replace(/\n/g, '<br>')}</p>
        <hr>
        <h2>3. 행동특성 및 종합의견</h2>
        <p>${generatedResults[RecordSection.BEHAVIORAL].replace(/\n/g, '<br>')}</p>
      </body></html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.name}_생기부.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-indigo-600 dark:text-indigo-400 text-2xl font-bold mr-2">EduRecord AI</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-semibold">BETA</span>
            </div>
            <div className="flex items-center space-x-4">
              {step === 'result' && (
                <button 
                  onClick={() => setStep('input')}
                  className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium"
                >
                  &larr; 입력 수정하기
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- INPUT STEP --- */}
        {step === 'input' && (
          <div className="space-y-8 animate-fade-in">
            {/* 1. Student Info Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-sm mr-3">1</span>
                학생 기본 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">학생 이름</label>
                  <input 
                    type="text"
                    value={student.name}
                    onChange={(e) => handleStudentChange('name', e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">진학 희망 계열</label>
                  <select 
                    value={student.field}
                    onChange={(e) => handleStudentChange('field', e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                  >
                    {Object.values(StudentField).map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">희망 전공/진로</label>
                  <input 
                    type="text"
                    value={student.careerPath}
                    onChange={(e) => handleStudentChange('careerPath', e.target.value)}
                    placeholder="예: 컴퓨터공학과, 간호사"
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                  />
                </div>
              </div>
            </section>

            {/* 2. Mode Selection & Activity Input */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-sm mr-3">2</span>
                활동 정보 입력
              </h2>

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6 w-full md:w-auto md:inline-flex">
                <button
                  onClick={() => setInputMode(InputMode.INTEGRATED)}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    inputMode === InputMode.INTEGRATED 
                    ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  모드 1: 통합 입력
                </button>
                <button
                  onClick={() => setInputMode(InputMode.SECTIONAL)}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    inputMode === InputMode.SECTIONAL 
                    ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  모드 2: 영역별 입력
                </button>
              </div>

              {/* Input Forms */}
              {inputMode === InputMode.INTEGRATED ? (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      1년간의 모든 활동 내용 (날짜, 활동명, 역할, 느낀점 등)
                    </label>
                    <textarea 
                      className="w-full h-64 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 border"
                      placeholder="예: 3월 학급 반장 선출, 5월 체육대회 응원단장, 9월 과학 탐구 보고서 작성(주제: AI윤리)..."
                      value={activityData.integrated.text}
                      onChange={(e) => handleIntegratedChange('text', e.target.value)}
                    />
                  </div>
                  <FileUploader 
                    files={activityData.integrated.files} 
                    onFilesChange={(files) => handleIntegratedChange('files', files)} 
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">추가 메모</label>
                    <input 
                      type="text"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                      placeholder="강조하고 싶은 키워드나 특이사항"
                      value={activityData.integrated.memo}
                      onChange={(e) => handleIntegratedChange('memo', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                    <nav className="-mb-px flex space-x-8">
                      {[RecordSection.AUTONOMOUS, RecordSection.CAREER, RecordSection.BEHAVIORAL].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === tab
                              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                          `}
                        >
                          {tab === RecordSection.AUTONOMOUS && '자율활동'}
                          {tab === RecordSection.CAREER && '진로활동'}
                          {tab === RecordSection.BEHAVIORAL && '행동특성'}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  {/* Render active tab content */}
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {activeTab === RecordSection.AUTONOMOUS && '자율활동 내용 (임원, 행사 등)'}
                          {activeTab === RecordSection.CAREER && '진로활동 내용 (동아리, 탐구, 독서 등)'}
                          {activeTab === RecordSection.BEHAVIORAL && '행동특성 및 관찰 내용'}
                        </label>
                        <textarea 
                          className="w-full h-48 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 border"
                          value={activityData.sectional[activeTab].text}
                          onChange={(e) => handleSectionalChange(activeTab, 'text', e.target.value)}
                        />
                     </div>
                     <FileUploader 
                        files={activityData.sectional[activeTab].files} 
                        onFilesChange={(files) => handleSectionalChange(activeTab, 'files', files)} 
                      />
                     <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">특이사항/메모</label>
                      <input 
                        type="text"
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                        value={activityData.sectional[activeTab].memo}
                        onChange={(e) => handleSectionalChange(activeTab, 'memo', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={handleGenerateAll}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition hover:scale-105 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  생기부 3영역 자동 생성하기
                </button>
              </div>
            </section>
          </div>
        )}

        {/* --- RESULT STEP --- */}
        {step === 'result' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center mb-6 no-print">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">생성 결과: {student.name}</h2>
               <div className="flex space-x-3">
                 <button 
                  onClick={handleDownloadWord}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow transition flex items-center"
                 >
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Word 다운로드
                 </button>
                 <button 
                  onClick={() => window.print()}
                  className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow transition flex items-center"
                 >
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                   PDF / 인쇄
                 </button>
               </div>
            </div>

            <div className="print-section">
              <ResultCard 
                section={RecordSection.AUTONOMOUS}
                title="1. 자율활동 특기사항"
                content={generatedResults[RecordSection.AUTONOMOUS]}
                isGenerating={isGenerating[RecordSection.AUTONOMOUS]}
                targetLength={500}
                onContentChange={(val) => setGeneratedResults(prev => ({...prev, [RecordSection.AUTONOMOUS]: val}))}
                onRegenerate={() => handleGenerate(RecordSection.AUTONOMOUS)}
              />

              <ResultCard 
                section={RecordSection.CAREER}
                title="2. 진로활동 특기사항"
                content={generatedResults[RecordSection.CAREER]}
                isGenerating={isGenerating[RecordSection.CAREER]}
                targetLength={700}
                onContentChange={(val) => setGeneratedResults(prev => ({...prev, [RecordSection.CAREER]: val}))}
                onRegenerate={() => handleGenerate(RecordSection.CAREER)}
              />

              <ResultCard 
                section={RecordSection.BEHAVIORAL}
                title="3. 행동특성 및 종합의견"
                content={generatedResults[RecordSection.BEHAVIORAL]}
                isGenerating={isGenerating[RecordSection.BEHAVIORAL]}
                targetLength={500}
                onContentChange={(val) => setGeneratedResults(prev => ({...prev, [RecordSection.BEHAVIORAL]: val}))}
                onRegenerate={() => handleGenerate(RecordSection.BEHAVIORAL)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;