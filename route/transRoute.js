const express = require('express');
const router = express.Router();
const connection = require('../db');

// 모든 거래 조회
router.route("/")
    .get((req, res) => {
        const query = 'SELECT * FROM tbl_transaction';
        connection.query(query, (err, results) => {
            if (err) {
                console.error('쿼리 실행 실패:', err);
                return res.status(500).json({ success: false, message: '서버 오류' });
            }
            res.json({ success: true, list: results });
        });
    });

// 특정 사용자 거래 조회
router.route("/:userId")
    .get((req, res) => {
        const userId = req.params.userId;
        const query = 'SELECT * FROM tbl_transaction WHERE user_id = ? ORDER BY date ASC';
        connection.query(query, [userId], (err, results) => {
            if (err) {
                console.error('쿼리 실행 실패:', err);
                return res.status(500).json({ success: false, message: '서버 오류' });
            }
            res.json({ success: true, list: results });
        });
    });

// 거래 추가
router.route("/insert")
    .post(async (req, res) => {
        const { user_id, description, amount, type, category, date } = req.body;

        // 입력 값 검증
        if (!user_id || !description || amount === undefined || !type || !category) {
            return res.status(400).json({ success: false, message: '모든 필드를 입력해야 합니다.' });
        }

        // 사용자 존재 여부 확인
        const userCheckQuery = 'SELECT COUNT(*) AS count FROM tbl_user WHERE user_id = ?';
        connection.query(userCheckQuery, [user_id], (err, results) => {
            if (err) {
                console.error('사용자 존재 여부 확인 오류:', err);
                return res.status(500).json({ success: false, message: '서버 오류' });
            }

            // 사용자 존재 여부 확인
            if (results[0].count === 0) {
                return res.status(404).json({ success: false, message: '사용자가 존재하지 않습니다.' });
            }

            let transactionType;
            if(type == 'income'){
                transactionType = '수입';
            }else if(type == 'expense'){
                transactionType = '지출';
            } else {
                return res.status(400).json({ success: false, message: '유효하지 않은 거래 유형입니다.' });
            }
            
            const query = 'INSERT INTO tbl_transaction (user_id, description, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?)';
            
            // 날짜 처리: 클라이언트에서 날짜를 받지 않으면 서버에서 현재 날짜를 사용
            const transactionDate = date || new Date().toISOString().split('T')[0]; // date가 없으면 현재 날짜로 설정 (YYYY-MM-DD) (YYYY-MM-DDTHH:mm:ss.sssZ)
            connection.query(query, [user_id, description, amount, transactionType, category, transactionDate], (error, results) => {
                if (error) {
                    console.error('쿼리 실행 실패:', error);
                    return res.status(500).json({ success: false, message: 'DB 오류' });
                }
                res.json({ success: true, message: '거래 추가 성공' });
            });
        });
    });

module.exports = router;
