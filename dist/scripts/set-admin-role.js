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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/set-admin-role.ts
const dotenv_1 = __importDefault(require("dotenv"));
const firebaseService_1 = require("../services/services/firebaseService");
const admin = __importStar(require("firebase-admin"));
dotenv_1.default.config({ path: '.env' });
/**
 * 특정 사용자의 이메일 주소를 사용하여 Firestore의 users 문서에 admin 역할을 부여합니다.
 * Firebase Authentication에 해당 이메일의 사용자가 존재해야 합니다.
 * @param email 관리자로 지정할 사용자의 이메일
 */
async function setAdminRole(email) {
    if (!email) {
        console.error('❌ 이메일 주소가 제공되지 않았습니다. 예: ts-node <script_name>.ts your-email@example.com');
        return;
    }
    console.log(`🔧 사용자 [${email}]에게 관리자(admin) 역할을 부여합니다...`);
    try {
        await firebaseService_1.firebaseService.initialize();
        const auth = admin.auth();
        const db = firebaseService_1.firebaseService.getFirestore();
        // 1. Firebase Authentication에서 이메일로 사용자 조회
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        }
        catch (error) {
            console.error(`❌ Firebase Authentication에서 [${email}] 사용자를 찾을 수 없습니다.`);
            return;
        }
        const userId = userRecord.uid;
        console.log(`✅ Authentication에서 사용자 확인: UID [${userId}]`);
        // 2. Firestore의 'users' 컬렉션에 역할(role) 필드 설정
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.set({
            email: userRecord.email,
            role: 'admin',
            displayName: userRecord.displayName || '',
            createdAt: new Date(), // 문서가 없을 경우를 대비해 생성 시간 기록
        }, { merge: true }); // merge: true는 기존 필드를 유지하면서 role 필드만 추가/수정
        console.log(`🎉 성공! 사용자 [${email}] (UID: ${userId})가 이제 관리자입니다.`);
        console.log("Firestore의 'users' 컬렉션에서 해당 문서를 확인하세요.");
    }
    catch (error) {
        console.error('❌ 관리자 역할 설정 중 심각한 오류 발생:', error);
        process.exit(1);
    }
}
// 커맨드 라인 인자로부터 이메일 주소 받기
const email = process.argv[2];
setAdminRole(email);
