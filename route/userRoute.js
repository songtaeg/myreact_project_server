const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const connection = require('../db');
const bcrypt = require('bcrypt');

const JWT_KEY = "secret_key";
const ROUND = 10;

// 사용자 조회 및 로그인 처리
router.route("/")
    .get((req, res) => {
        const query = 'SELECT * FROM TBL_USER';
        connection.query(query, (err, results) => {
            if (err) {
                console.error('쿼리 실행 실패:', err);
                return res.status(500).json({ success: false, message: '서버 오류' });
            }
            res.render('user', { list: results });
        });
    })

    .post(async (req, res) => {
        const { id, password } = req.body;
        const query = 'SELECT * FROM TBL_USER WHERE user_id = ?';

        connection.query(query, [id], async (err, results) => {
            if (err) {
                console.error('쿼리 실행 실패:', err);
                return res.status(500).json({ success: false, message: '서버 오류' });
            }

            if (results.length > 0) {
                const user = results[0];
                const dbpwd = user.pwd;

                // 비밀번호 비교
                const result = await bcrypt.compare(password, dbpwd);
                if (result) {
                    const token = jwt.sign({ userId: user.user_id }, JWT_KEY, { expiresIn: '1h' });
                    return res.json({ success: true, message: "로그인 성공", token, userName: user.name, userId: user.user_id });
                } else {
                    return res.json({ success: false, message: '비밀번호가 잘못되었습니다.' });
                }
            } else {
                return res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
            }
        });
    });

// 아이디 중복 체크
router.route("/checkid")
    .get((req, res) => {
        const { id } = req.query;
        const query = 'SELECT * FROM TBL_USER WHERE user_id = ?';

        connection.query(query, [id], (err, results) => {
            if (err) {
                console.error('쿼리 실행 실패:', err);
                return res.status(500).json({ success: false, message: '서버 오류' });
            }

            // 사용자가 없으면 사용 가능
            const available = results.length === 0; // 결과가 없으면 사용 가능
            res.json({ success: true, available });
        });
    });

// 사용자 등록
router.route("/insert")
    .post(async (req, res) => {
        const { id, name, pwd, email } = req.body; // name과 email 추가

        // 입력 검증
        if (!id || !name || !pwd || !email) {
            return res.status(400).json({ success: false, message: "모든 필드를 입력해주세요." });
        }

        const query = 'INSERT INTO tbl_user (user_id, name, pwd, email) VALUES (?, ?, ?, ?)';

        try {
            const pwdHash = await bcrypt.hash(pwd, ROUND);
            connection.query(query, [id, name, pwdHash, email], (err, results) => {
                if (err) {
                    console.log('DB 오류:', err);
                    return res.status(500).json({ success: false, message: "DB 오류" });
                }
                res.json({ success: true, message: "가입 성공" });
            });
        } catch (error) {
            console.log('비밀번호 해시 생성 실패:', error);
            return res.status(500).json({ success: false, message: "비밀번호 해시 생성 실패" });
        }
    });

module.exports = router;
