"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseService = void 0;
// services/firebaseService.ts - Firebase/Firestore 연결 관리
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class FirebaseService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }
    static getInstance() {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }
    /**
     * Firebase Admin SDK 초기화
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ Firebase가 이미 초기화되어 있습니다.');
            return;
        }
        try {
            console.log('🔧 Firebase Admin SDK 초기화 시작...');
            // 로컬 개발 환경 확인
            const isLocalDevelopment = process.env.LOCAL_DEVELOPMENT === 'true';
            console.log(`🌍 환경: ${isLocalDevelopment ? '로컬 개발' : '프로덕션'}`);
            // 서비스 계정 키 설정 - 환경변수 우선
            let serviceAccount;
            // 1. 환경변수에서 서비스 계정 정보 확인
            if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
                console.log('📝 환경변수에서 Firebase 서비스 계정 정보 로드');
                serviceAccount = {
                    type: "service_account",
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                };
            }
            // 2. 환경변수에 파일 경로가 있는 경우
            else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
                const serviceKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
                if (!fs.existsSync(serviceKeyPath)) {
                    throw new Error(`서비스 계정 키 파일을 찾을 수 없습니다: ${serviceKeyPath}`);
                }
                console.log('📁 파일에서 Firebase 서비스 계정 정보 로드');
                serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
            }
            // 3. 기본 경로에서 찾기 (임시 - 보안상 권장하지 않음)
            else {
                console.warn('⚠️ 환경변수에 Firebase 설정이 없습니다. 기본 경로를 확인합니다...');
                const serviceKeyPath = path.join(process.cwd(), 'ServiceKey', 'ServiceKey', 'pipmaker-signals-firebase-adminsdk-fbsvc-76cad20460.json');
                if (!fs.existsSync(serviceKeyPath)) {
                    throw new Error(`Firebase 서비스 계정 키를 찾을 수 없습니다. 환경변수를 설정하거나 키 파일을 배치하세요: ${serviceKeyPath}`);
                }
                console.log('🔧 기본 파일에서 Firebase 서비스 계정 정보 로드 (보안 경고: 환경변수 사용 권장)');
                serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
            }
            // Firebase 앱이 이미 초기화되어 있는지 확인
            if (admin.apps.length === 0) {
                const appConfig = {
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id
                };
                // 로컬 개발 환경에서 에뮬레이터 사용
                if (isLocalDevelopment) {
                    console.log('🔧 로컬 Firebase 에뮬레이터 설정 중...');
                    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:9080';
                    console.log('✅ Firebase 에뮬레이터 호스트 설정 완료 (포트: 9080)');
                }
                admin.initializeApp(appConfig);
                console.log('✅ Firebase 앱 초기화 완료');
            }
            else {
                console.log('✅ Firebase 앱이 이미 초기화되어 있습니다.');
            }
            // Firestore 인스턴스 가져오기
            this.db = admin.firestore();
            // 연결 테스트
            await this.testConnection();
            this.isInitialized = true;
            console.log('✅ Firebase/Firestore 연결 완료');
        }
        catch (error) {
            console.error('❌ Firebase 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * Firestore 연결 테스트
     */
    async testConnection() {
        try {
            if (!this.db) {
                throw new Error('Firestore 인스턴스가 초기화되지 않았습니다.');
            }
            // 간단한 쿼리로 연결 테스트 (실제 존재하는 컬렉션 사용)
            const testRef = this.db.collection('processed_signals');
            await testRef.limit(1).get();
            console.log('✅ Firestore 연결 테스트 성공');
        }
        catch (error) {
            console.error('❌ Firestore 연결 테스트 실패:', error);
            // 연결 테스트 실패해도 초기화는 계속 진행 (컬렉션이 없을 수 있음)
            console.log('⚠️ 연결 테스트 실패했지만 초기화를 계속합니다.');
        }
    }
    /**
     * Firestore 인스턴스 반환
     */
    getFirestore() {
        if (!this.db) {
            throw new Error('Firestore가 초기화되지 않았습니다. initialize() 메서드를 먼저 호출하세요.');
        }
        return this.db;
    }
    /**
     * 컬렉션 데이터 조회
     */
    async getCollectionData(collectionName, limit = 10) {
        try {
            const db = this.getFirestore();
            const collectionRef = db.collection(collectionName);
            // timestamp 필드가 있는지 확인하고 쿼리 구성
            let snapshot;
            try {
                snapshot = await collectionRef.orderBy('timestamp', 'desc').limit(limit).get();
            }
            catch (orderByError) {
                // timestamp 필드가 없으면 생성 시간으로 정렬 시도
                try {
                    snapshot = await collectionRef.orderBy('generated_at', 'desc').limit(limit).get();
                }
                catch (generatedAtError) {
                    // 정렬 필드가 없으면 단순 조회
                    snapshot = await collectionRef.limit(limit).get();
                }
            }
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error(`❌ 컬렉션 조회 실패 (${collectionName}):`, error);
            // 오류가 발생해도 빈 배열 반환 (서비스 중단 방지)
            return [];
        }
    }
    /**
     * 문서 추가
     */
    async addDocument(collectionName, data) {
        try {
            const db = this.getFirestore();
            // 시간대 처리: KST 시간을 UTC로 변환하여 저장
            const processedData = { ...data };
            // timestamp나 generated_at 필드가 있으면 KST -> UTC 변환
            if (processedData.timestamp && typeof processedData.timestamp === 'string') {
                processedData.timestamp = this.convertKSTToUTC(processedData.timestamp);
            }
            if (processedData.generated_at && typeof processedData.generated_at === 'string') {
                processedData.generated_at = this.convertKSTToUTC(processedData.generated_at);
            }
            // 서버 타임스탬프 추가
            processedData.timestamp = admin.firestore.FieldValue.serverTimestamp();
            const docRef = await db.collection(collectionName).add(processedData);
            console.log(`✅ 문서 추가 완료: ${collectionName}/${docRef.id}`);
            return docRef.id;
        }
        catch (error) {
            console.error(`❌ 문서 추가 실패 (${collectionName}):`, error);
            throw error;
        }
    }
    /**
     * KST 시간을 UTC로 변환
     */
    convertKSTToUTC(kstTime) {
        try {
            const date = new Date(kstTime);
            // KST에서 UTC로 변환 (9시간 빼기)
            const utcDate = new Date(date.getTime() - (9 * 60 * 60 * 1000));
            return utcDate.toISOString();
        }
        catch (error) {
            console.error('시간 변환 오류:', error);
            return kstTime;
        }
    }
    /**
     * 문서 업데이트
     */
    async updateDocument(collectionName, docId, data) {
        try {
            const db = this.getFirestore();
            await db.collection(collectionName).doc(docId).update({
                ...data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ 문서 업데이트 완료: ${collectionName}/${docId}`);
        }
        catch (error) {
            console.error(`❌ 문서 업데이트 실패 (${collectionName}/${docId}):`, error);
            throw error;
        }
    }
    /**
     * 문서 삭제
     */
    async deleteDocument(collectionName, docId) {
        try {
            const db = this.getFirestore();
            await db.collection(collectionName).doc(docId).delete();
            console.log(`✅ 문서 삭제 완료: ${collectionName}/${docId}`);
        }
        catch (error) {
            console.error(`❌ 문서 삭제 실패 (${collectionName}/${docId}):`, error);
            throw error;
        }
    }
    /**
     * 연결 상태 확인
     */
    isConnected() {
        return this.isInitialized && this.db !== null;
    }
    /**
     * 재연결 시도
     */
    async reconnect() {
        try {
            console.log('🔄 Firebase 재연결 시도 중...');
            // 기존 연결 종료
            if (this.db) {
                await this.db.terminate();
                this.db = null;
                this.isInitialized = false;
            }
            // 재초기화
            await this.initialize();
            console.log('✅ Firebase 재연결 성공');
        }
        catch (error) {
            console.error('❌ Firebase 재연결 실패:', error);
            throw error;
        }
    }
    /**
     * 연결 종료
     */
    async close() {
        try {
            if (this.db) {
                await this.db.terminate();
                this.db = null;
                this.isInitialized = false;
                console.log('✅ Firestore 연결 종료 완료');
            }
        }
        catch (error) {
            console.error('❌ Firestore 연결 종료 실패:', error);
            throw error;
        }
    }
}
// 싱글톤 인스턴스 내보내기
exports.firebaseService = FirebaseService.getInstance();
exports.default = exports.firebaseService;
