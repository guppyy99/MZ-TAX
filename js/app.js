// 전역 변수
let selectedFiles = [];

// DOM 요소
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileListSection = document.getElementById('fileListSection');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const adNameInput = document.getElementById('adName');
const monthInput = document.getElementById('month');
const companyAInput = document.getElementById('companyA');
const companyBInput = document.getElementById('companyB');
const previewSection = document.getElementById('previewSection');
const previewList = document.getElementById('previewList');
const processBtn = document.getElementById('processBtn');
const printBtn = document.getElementById('printBtn');
const messageDiv = document.getElementById('message');
const deleteAllBtn = document.getElementById('deleteAllBtn');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 드롭존 클릭 시 파일 선택
    dropZone.addEventListener('click', () => fileInput.click());

    // 파일 선택
    fileInput.addEventListener('change', handleFileSelect);

    // 드래그 앤 드롭
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // 입력 필드 변경 시 미리보기 업데이트
    [adNameInput, monthInput, companyAInput, companyBInput].forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // 처리 버튼
    processBtn.addEventListener('click', processFiles);

    // 인쇄 버튼
    printBtn.addEventListener('click', printFiles);

    // 전체 삭제 버튼
    deleteAllBtn.addEventListener('click', deleteAllFiles);
}

// 드래그 오버
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
}

// 드래그 리브
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
}

// 드롭
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

// 파일 선택
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

// 파일 추가
function addFiles(files) {
    selectedFiles = [...selectedFiles, ...files];
    updateFileList();

    // 첫 번째 파일에서 정보 자동 추출
    if (selectedFiles.length > 0) {
        extractInfoFromFirstFile();
    }

    updatePreview();
    processBtn.disabled = selectedFiles.length === 0;
    printBtn.disabled = selectedFiles.length === 0;
}

// 파일 제거
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updatePreview();
    processBtn.disabled = selectedFiles.length === 0;
    printBtn.disabled = selectedFiles.length === 0;

    if (selectedFiles.length === 0) {
        fileListSection.style.display = 'none';
        previewSection.style.display = 'none';
    }
}

// 전체 파일 삭제
function deleteAllFiles() {
    if (selectedFiles.length === 0) return;

    if (confirm(`선택된 ${selectedFiles.length}개의 파일을 모두 삭제하시겠습니까?`)) {
        selectedFiles = [];
        updateFileList();
        updatePreview();
        processBtn.disabled = true;
        printBtn.disabled = true;
        fileListSection.style.display = 'none';
        previewSection.style.display = 'none';
        showMessage('모든 파일이 삭제되었습니다.', 'success');
    }
}

// 파일 목록 업데이트
function updateFileList() {
    if (selectedFiles.length === 0) {
        fileListSection.style.display = 'none';
        return;
    }

    fileListSection.style.display = 'block';
    fileCount.textContent = selectedFiles.length;

    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <span class="file-name">${file.name}</span>
            <button class="file-remove" onclick="removeFile(${index})">×</button>
        </div>
    `).join('');
}

// 파일명에서 정보 추출 (첫 번째 파일 기준)
function extractInfoFromFirstFile() {
    if (selectedFiles.length === 0) return;

    const fileName = selectedFiles[0].name;
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // 확장자 제거

    // 모든 구분자를 공백으로 변환하여 토큰화
    const tokens = baseName.split(/[_\-\s.()]+/).filter(t => t.length > 0);

    // 광고명 추출 (일반적인 키워드가 아닌 것 중 첫 번째)
    const excludeKeywords = [
        '지출결의서', '품의서', '세금계산서', '견적서', '게재신청서', '거래명세서',
        '리포트', '보고서', '결과물', '사업자등록증', '통장사본',
        '광고', '정산', '선지급', '외주', '구매', '일반', '범용',
        '메가존', '발신', '발송', 'invoice', 'contract', 'agreement', 'receipt',
        'estimate', 'report', 'statement', 'proposal'
    ];

    let adName = '';
    let month = '';
    let companyB = '';

    // 월 추출 (숫자 + '월' 패턴)
    for (const token of tokens) {
        const monthMatch = token.match(/^(\d{1,2})월?$/);
        if (monthMatch) {
            month = monthMatch[1] + '월';
            break;
        }
    }

    // 을 업체명 추출 (메가존이 아닌 회사명으로 추정되는 것)
    const companyKeywords = ['프리비알', '메타버즈', '비티진', '네이버', '카카오', '구글', '페이스북', '인스타그램'];
    for (const token of tokens) {
        for (const keyword of companyKeywords) {
            if (token.includes(keyword) && !token.includes('메가존')) {
                companyB = token;
                break;
            }
        }
        if (companyB) break;
    }

    // 광고명 추출
    for (const token of tokens) {
        const isExcluded = excludeKeywords.some(kw => token.toLowerCase().includes(kw.toLowerCase()));
        const isMonth = /^\d{1,2}월?$/.test(token);
        const isCompany = token === companyB || token.includes('메가존');

        if (!isExcluded && !isMonth && !isCompany && token.length >= 2) {
            adName = token;
            break;
        }
    }

    // 입력 필드가 비어있을 때만 자동 채움
    if (!adNameInput.value && adName) {
        adNameInput.value = adName;
    }
    if (!monthInput.value && month) {
        monthInput.value = month;
    }
    if (!companyBInput.value && companyB) {
        companyBInput.value = companyB;
    }
}

// 파일 유형 및 넘버링 결정
function getFileTypeAndNumber(fileName) {
    const baseName = fileName.toLowerCase();

    // 0: 사업자등록증, 통장사본 등
    if (baseName.includes('사업자등록증') || baseName.includes('사업자')) {
        return { number: '0', type: '사업자등록증', needsFullInfo: false };
    }
    if (baseName.includes('통장사본') || baseName.includes('통장')) {
        return { number: '0', type: '통장사본', needsFullInfo: false };
    }

    // 1: 지출결의서
    if (baseName.includes('지출결의서') || baseName.includes('지출결의')) {
        return { number: '1', type: '지출결의서', needsFullInfo: true };
    }

    // 2-2: 선지급 품의서
    if (baseName.includes('선지급')) {
        return { number: '2-2', type: '선지급품의서', needsFullInfo: true };
    }

    // 2-1: 광고정산품의서, 일반품의서, 외주구매품의서
    if (baseName.includes('광고') && baseName.includes('품의')) {
        return { number: '2-1', type: '광고정산품의서', needsFullInfo: true };
    }
    if (baseName.includes('외주') || baseName.includes('구매품의')) {
        return { number: '2-1', type: '외주구매품의서', needsFullInfo: true };
    }
    if (baseName.includes('품의서') || baseName.includes('품의')) {
        return { number: '2-1', type: '일반품의서', needsFullInfo: true };
    }
    // 영어: proposal
    if (baseName.includes('proposal')) {
        return { number: '2-1', type: '일반품의서', needsFullInfo: true };
    }

    // 3-1, 3-2: 세금계산서, 영수증, invoice
    if (baseName.includes('세금계산서') || baseName.includes('계산서') || baseName.includes('invoice')) {
        // 발신자 확인
        if (baseName.includes('메가존') && (baseName.includes('발신') || baseName.includes('발송'))) {
            return { number: '3-2', type: '세금계산서', needsFullInfo: true, sender: 'A' };
        }
        return { number: '3-1', type: '세금계산서', needsFullInfo: true, sender: 'B' };
    }

    // 4: 견적서, 게재신청서, 거래명세서, 계약서 관련
    if (baseName.includes('견적서') || baseName.includes('견적') || baseName.includes('estimate')) {
        return { number: '4', type: '견적서', needsFullInfo: true };
    }
    if (baseName.includes('게재신청서') || baseName.includes('게재신청')) {
        return { number: '4', type: '게재신청서', needsFullInfo: true };
    }
    if (baseName.includes('거래명세서') || baseName.includes('거래명세') || baseName.includes('statement')) {
        return { number: '4', type: '거래명세서', needsFullInfo: true };
    }

    // 계약서 관련 (계약서, 약정서, 합의서, 협약서, 확약서, 각서, 약속서)
    // 영어: contract, agreement
    if (baseName.includes('계약서') || baseName.includes('계약') || baseName.includes('contract')) {
        return { number: '4', type: '계약서', needsFullInfo: true };
    }
    if (baseName.includes('약정서') || baseName.includes('약정') || baseName.includes('agreement')) {
        return { number: '4', type: '약정서', needsFullInfo: true };
    }
    if (baseName.includes('합의서') || baseName.includes('합의')) {
        return { number: '4', type: '합의서', needsFullInfo: true };
    }
    if (baseName.includes('협약서') || baseName.includes('협약')) {
        return { number: '4', type: '협약서', needsFullInfo: true };
    }
    if (baseName.includes('확약서') || baseName.includes('확약')) {
        return { number: '4', type: '확약서', needsFullInfo: true };
    }
    if (baseName.includes('각서')) {
        return { number: '4', type: '각서', needsFullInfo: true };
    }
    if (baseName.includes('약속서') || baseName.includes('약속')) {
        return { number: '4', type: '약속서', needsFullInfo: true };
    }

    // 5: 결과물 (리포트, 보고서, report)
    if (baseName.includes('리포트') || baseName.includes('보고서') || baseName.includes('결과물') || baseName.includes('report')) {
        return { number: '5', type: '결과물', needsFullInfo: true };
    }

    // 영수증 (receipt) - 세금계산서로 처리
    if (baseName.includes('영수증') || baseName.includes('receipt')) {
        return { number: '3-1', type: '세금계산서', needsFullInfo: true, sender: 'B' };
    }

    // 기본값 (알 수 없는 파일)
    return { number: '?', type: '알수없음', needsFullInfo: true };
}

// 날짜 생성 (YYMMDD)
function getCurrentDate() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return yy + mm + dd;
}

// 새 파일명 생성
function generateNewFileName(file, info) {
    const ext = file.name.match(/\.[^/.]+$/)?.[0] || '';
    const date = getCurrentDate();

    const adName = adNameInput.value.trim();
    const month = monthInput.value.trim();
    const companyA = companyAInput.value.trim();
    const companyB = companyBInput.value.trim();

    const fileInfo = getFileTypeAndNumber(file.name);

    // 0번 유형 (사업자등록증, 통장사본 등)
    if (!fileInfo.needsFullInfo) {
        const company = companyB || '업체명';
        return `${fileInfo.number}. ${fileInfo.type}_${company}_${date}${ext}`;
    }

    // 나머지 유형들
    if (!adName || !month || !companyA || !companyB) {
        return null; // 정보 부족
    }

    // 세금계산서 (발신자 표시)
    if (fileInfo.type === '세금계산서') {
        const sender = fileInfo.sender === 'A' ? companyA : companyB;
        return `${fileInfo.number}. ${fileInfo.type}_[${sender} 발신]_${month}_${adName}_${companyA}_${companyB}_${date}${ext}`;
    }

    // 일반 형식
    return `${fileInfo.number}. ${fileInfo.type}_${month}_${adName}_${companyA}_${companyB}_${date}${ext}`;
}

// 미리보기 업데이트
function updatePreview() {
    if (selectedFiles.length === 0) {
        previewSection.style.display = 'none';
        return;
    }

    previewSection.style.display = 'block';

    const previews = selectedFiles.map(file => {
        const newName = generateNewFileName(file);

        if (!newName) {
            return `
                <div class="preview-item">
                    <div class="preview-original">${file.name}</div>
                    <div class="preview-arrow">→</div>
                    <div class="preview-new" style="color: #ef4444;">필수 정보를 입력해주세요</div>
                </div>
            `;
        }

        return `
            <div class="preview-item">
                <div class="preview-original">${file.name}</div>
                <div class="preview-arrow">→</div>
                <div class="preview-new">${newName}</div>
            </div>
        `;
    }).join('');

    previewList.innerHTML = previews;
}

// 파일명으로 정렬하는 함수 (넘버링 순서대로)
function sortFilesByNumber(files) {
    return files.map((file, index) => ({
        file,
        originalIndex: index,
        newName: generateNewFileName(file)
    }))
    .filter(item => item.newName) // 유효한 파일명만
    .sort((a, b) => {
        // 넘버링 추출 (예: "0", "1", "2-1", "2-2", "3-1", "3-2", "4", "5")
        const getNumber = (name) => {
            const match = name.match(/^(\d+(?:-\d+)?)\./);
            if (!match) return 999;

            const num = match[1];
            if (num.includes('-')) {
                const [major, minor] = num.split('-').map(Number);
                return major + (minor / 10);
            }
            return Number(num);
        };

        return getNumber(a.newName) - getNumber(b.newName);
    });
}

// 일괄 인쇄 (실제 파일을 넘버링 순서대로)
async function printFiles() {
    if (selectedFiles.length === 0) {
        showMessage('파일을 선택해주세요.', 'error');
        return;
    }

    const sortedFiles = sortFilesByNumber(selectedFiles);

    if (sortedFiles.length === 0) {
        showMessage('인쇄 가능한 파일이 없습니다. 필수 정보를 입력해주세요.', 'error');
        return;
    }

    showMessage('파일을 넘버링 순서대로 열어 인쇄합니다. 각 파일의 인쇄 창에서 인쇄해주세요.', 'info');

    // 파일을 순차적으로 열기
    for (let i = 0; i < sortedFiles.length; i++) {
        const item = sortedFiles[i];
        const url = URL.createObjectURL(item.file);

        // 새 탭에서 파일 열기
        const printWindow = window.open(url, '_blank');

        // 파일이 PDF나 이미지인 경우 브라우저가 자동으로 표시
        // 사용자가 Ctrl+P로 인쇄 가능

        // 메모리 누수 방지를 위해 일정 시간 후 URL 해제
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000); // 1분 후 해제

        // 파일 간 간격 (너무 빠르게 열리면 브라우저가 팝업 차단)
        if (i < sortedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    showMessage(`${sortedFiles.length}개 파일을 순서대로 열었습니다.`, 'success');
}

// Zip 파일로 다운로드
async function processFiles() {
    if (selectedFiles.length === 0) {
        showMessage('파일을 선택해주세요.', 'error');
        return;
    }

    try {
        const zip = new JSZip();
        const sortedFiles = sortFilesByNumber(selectedFiles);

        if (sortedFiles.length === 0) {
            showMessage('변환 가능한 파일이 없습니다. 필수 정보를 입력해주세요.', 'error');
            return;
        }

        // 파일들을 Zip에 추가
        for (const item of sortedFiles) {
            zip.file(item.newName, item.file);
        }

        // Zip 파일 생성
        const content = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        // Zip 파일 다운로드
        const date = getCurrentDate();
        const zipFileName = `MZ-TAX_변경파일_${date}.zip`;

        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = zipFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage(`${sortedFiles.length}개 파일이 Zip으로 다운로드되었습니다!`, 'success');
    } catch (error) {
        showMessage('Zip 생성 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 메시지 표시
function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// 전역 함수로 노출 (HTML에서 사용)
window.removeFile = removeFile;
