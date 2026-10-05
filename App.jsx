import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { ref, push, set, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "./firebase";
import { Heart, Sparkles, Plus, ArrowRight, Trophy, Share2, RotateCcw, Copy, Check, Users, Clock3 } from "lucide-react";

const defaultQuestions = [
  { question: "", options: ["", "", "", ""], answer: 0 }
];

async function createQuiz(data) {
  const quizRef = push(ref(db, "quizzes"));
  await set(quizRef, { ...data, createdAt: Date.now() });
  return quizRef.key;
}

async function loadQuiz(id) {
  const snap = await get(ref(db, `quizzes/${id}`));
  if (!snap.exists()) throw new Error("Quiz not found");
  return { id, ...snap.val() };
}

async function saveResult(data) {
  const resultRef = push(ref(db, "results"));
  await set(resultRef, { ...data, createdAt: Date.now() });
  return resultRef.key;
}

async function loadResults(quizId) {
  const q = query(ref(db, "results"), orderByChild("quizId"), equalTo(quizId));
  const snap = await get(q);
  if (!snap.exists()) return [];
  return Object.entries(snap.val())
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt);
}

function Shell({ children }) {
  return (
    <div className="app-shell">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <nav className="nav">
        <Link className="brand" to="/"><Heart size={18} fill="currentColor"/> FriendQuiz</Link>
        <Link className="nav-create" to="/create"><Plus size={17}/> Create</Link>
      </nav>
      <main>{children}</main>
      <footer>Made with curiosity, questionable friendship tests, and Firebase. ❤️</footer>
    </div>
  );
}

function Home() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  return (
    <Shell>
      <section className="hero">
        <div className="badge"><Sparkles size={15}/> THE FRIENDSHIP TEST</div>
        <h1>How well do your<br/><span>friends know you?</span></h1>
        <p>Create a quiz about yourself, share one link, and discover who was actually paying attention.</p>
        <div className="glass-card start-card">
          <label>Your name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..." maxLength={30}/>
          <button disabled={!name.trim()} onClick={() => navigate(`/create?name=${encodeURIComponent(name.trim())}`)}>
            Create my quiz <ArrowRight size={18}/>
          </button>
        </div>
        <div className="feature-row">
          <div><Users size={18}/><b>Unlimited friends</b><small>Share one link</small></div>
          <div><Trophy size={18}/><b>Live scores</b><small>See the leaderboard</small></div>
          <div><Sparkles size={18}/><b>Instant results</b><small>No account required</small></div>
        </div>
      </section>
    </Shell>
  );
}

function CreateQuiz() {
  const params = new URLSearchParams(location.search);
  const [creator, setCreator] = useState(params.get("name") || "");
  const [title, setTitle] = useState("How well do you know me?");
  const [questions, setQuestions] = useState(defaultQuestions);
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const updateQ = (i, key, value) => setQuestions(qs => qs.map((q, idx) => idx === i ? {...q, [key]: value} : q));
  const updateOption = (qi, oi, value) => setQuestions(qs => qs.map((q, idx) => idx === qi ? {...q, options: q.options.map((o,j) => j === oi ? value : o)} : q));

  const addQuestion = () => setQuestions(qs => [...qs, { question: "", options: ["", "", "", ""], answer: 0 }]);
  const removeQuestion = (i) => setQuestions(qs => qs.length === 1 ? qs : qs.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!creator.trim() || !title.trim()) return alert("Please enter your name and quiz title.");
    if (questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) return alert("Complete every question and option.");
    setCreating(true);
    try {
      const id = await createQuiz({
        creatorName: creator.trim(),
        title: title.trim(),
        questions,
      });
      setCreatedUrl(`${location.origin}/quiz/${id}`);
    } catch (e) {
      alert("Could not create quiz. Check your Firebase Realtime Database rules/config.");
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (createdUrl) return (
    <Shell>
      <section className="center-page">
        <div className="success-icon"><Check size={32}/></div>
        <div className="badge"><Sparkles size={15}/> QUIZ READY</div>
        <h1>Your quiz is <span>live!</span></h1>
        <p>Send this link to your friends. Humanity may now discover who remembers your favourite things.</p>
        <div className="link-box"><span>{createdUrl}</span><button onClick={copy}>{copied ? <Check/> : <Copy/>}</button></div>
        <div className="button-row">
          <button className="primary" onClick={copy}><Share2 size={18}/> Copy link</button>
          <Link className="secondary" to={`/quiz/${createdUrl.split("/").pop()}`}>Preview quiz</Link>
        </div>
      </section>
    </Shell>
  );

  return (
    <Shell>
      <section className="builder">
        <div className="page-heading">
          <div><div className="badge">CREATE YOUR QUIZ</div><h1>Make them prove<br/><span>they know you.</span></h1></div>
          <div className="question-count">{questions.length} questions</div>
        </div>

        <div className="glass-card form-card">
          <label>Your name</label>
          <input value={creator} onChange={e => setCreator(e.target.value)} placeholder="e.g. Sandip"/>
          <label>Quiz title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {questions.map((q, i) => (
          <div className="glass-card question-editor" key={i}>
            <div className="editor-top">
              <span>Question {i + 1}</span>
              {questions.length > 1 && <button className="delete-btn" onClick={() => removeQuestion(i)}>Remove</button>}
            </div>
            <input className="question-input" value={q.question} onChange={e => updateQ(i, "question", e.target.value)} placeholder="What is my favourite...?" />
            <div className="options-grid">
              {q.options.map((o, oi) => (
                <div className={`option-input ${q.answer === oi ? "correct" : ""}`} key={oi}>
                  <input value={o} onChange={e => updateOption(i, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65+oi)}`} />
                  <button title="Mark correct" onClick={() => updateQ(i, "answer", oi)}>{q.answer === oi ? "✓" : "○"}</button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button className="add-question" onClick={addQuestion}><Plus size={18}/> Add question</button>
        <button className="primary big" disabled={creating} onClick={submit}>{creating ? "Creating..." : "Generate my quiz"} <ArrowRight size={19}/></button>
      </section>
    </Shell>
  );
}

function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [player, setPlayer] = useState("");
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQuiz(id).then(setQuiz).catch(() => setQuiz({error:true})).finally(() => setLoading(false)); }, [id]);

  if (loading) return <Shell><div className="loading">Loading quiz <span>•••</span></div></Shell>;
  if (quiz?.error) return <Shell><div className="center-page"><h1>Quiz not found 😵</h1><p>This link may be invalid or deleted.</p><Link className="primary" to="/">Go home</Link></div></Shell>;

  const choose = async (option) => {
    const next = [...answers, option];
    if (current < quiz.questions.length - 1) {
      setAnswers(next);
      setCurrent(current + 1);
    } else {
      const score = quiz.questions.reduce((sum, q, i) => sum + (next[i] === q.answer ? 1 : 0), 0);
      await saveResult({ quizId: id, playerName: player.trim(), score, total: quiz.questions.length });
      navigate(`/result/${id}?score=${score}&total=${quiz.questions.length}&name=${encodeURIComponent(player.trim())}`);
    }
  };

  if (!started) return (
    <Shell>
      <section className="center-page quiz-intro">
        <div className="quiz-heart"><Heart size={30} fill="currentColor"/></div>
        <div className="badge">A QUIZ BY {quiz.creatorName.toUpperCase()}</div>
        <h1>{quiz.title}</h1>
        <p>{quiz.questions.length} questions. One chance to prove you're a real friend.</p>
        <div className="glass-card name-card">
          <label>Your name</label>
          <input value={player} onChange={e => setPlayer(e.target.value)} placeholder="Enter your name..." maxLength={30}/>
          <button className="primary big" disabled={!player.trim()} onClick={() => setStarted(true)}>Start quiz <ArrowRight/></button>
        </div>
      </section>
    </Shell>
  );

  const q = quiz.questions[current];
  const progress = ((current) / quiz.questions.length) * 100;
  return (
    <Shell>
      <section className="quiz-page">
        <div className="quiz-meta"><span>Question {current + 1} of {quiz.questions.length}</span><span>{Math.round(progress)}%</span></div>
        <div className="progress"><div style={{width:`${progress}%`}}/></div>
        <div className="quiz-question">
          <div className="badge">QUESTION {current + 1}</div>
          <h1>{q.question}</h1>
          <div className="answer-list">
            {q.options.map((o, i) => <button key={i} onClick={() => choose(i)}><span>{String.fromCharCode(65+i)}</span>{o}<ArrowRight size={17}/></button>)}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Result() {
  const { id } = useParams();
  const params = new URLSearchParams(location.search);
  const score = Number(params.get("score") || 0);
  const total = Number(params.get("total") || 0);
  const name = params.get("name") || "Friend";
  const percent = total ? Math.round((score / total) * 100) : 0;
  const [copied, setCopied] = useState(false);

  const message = percent === 100 ? "You know them ridiculously well. Suspicious. ❤️" :
    percent >= 70 ? "Pretty solid! You're definitely paying attention. ✨" :
    percent >= 40 ? "There is room for improvement, dear friend. 😭" :
    "Do you two actually know each other? 😭";

  const share = async () => {
    const text = `I scored ${score}/${total} on this quiz! Can you beat me?`;
    try {
      if (navigator.share) await navigator.share({title:"FriendQuiz", text, url:location.origin + `/quiz/${id}`});
      else { await navigator.clipboard.writeText(location.origin + `/quiz/${id}`); setCopied(true); setTimeout(()=>setCopied(false),1500); }
    } catch {}
  };

  return (
    <Shell>
      <section className="center-page result-page">
        <div className="result-trophy"><Trophy size={35}/></div>
        <div className="badge"><Sparkles size={15}/> RESULT</div>
        <h1>{name}, you scored<br/><span>{score} / {total}</span></h1>
        <div className="score-ring"><strong>{percent}%</strong><small>correct</small></div>
        <p>{message}</p>
        <div className="button-row">
          <button className="primary" onClick={share}><Share2 size={18}/>{copied ? "Copied!" : "Challenge friends"}</button>
          <Link className="secondary" to={`/leaderboard/${id}`}><Trophy size={18}/> Leaderboard</Link>
        </div>
        <Link className="reset-link" to="/">Create your own <ArrowRight size={15}/></Link>
      </section>
    </Shell>
  );
}

function Leaderboard() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadQuiz(id), loadResults(id)]).then(([q,r]) => { setQuiz(q); setResults(r); }).catch(()=>{}).finally(()=>setLoading(false));
  }, [id]);

  if (loading) return <Shell><div className="loading">Loading leaderboard <span>•••</span></div></Shell>;

  return (
    <Shell>
      <section className="leaderboard">
        <div className="badge"><Trophy size={15}/> LEADERBOARD</div>
        <h1>{quiz?.title || "Leaderboard"}</h1>
        <p>Everyone who has taken the quiz appears here.</p>
        <div className="rank-list">
          {results.length === 0 ? <div className="glass-card empty">No results yet. The friendship investigation begins now. 🕵️</div> :
          results.map((r,i) => (
            <div className={`rank glass-card ${i < 3 ? "top-rank" : ""}`} key={r.id}>
              <div className="rank-number">{i+1}</div>
              <div className="rank-name"><b>{r.playerName}</b><small>{r.score}/{r.total} correct</small></div>
              <strong>{Math.round((r.score/r.total)*100)}%</strong>
            </div>
          ))}
        </div>
        <Link className="secondary" to={`/quiz/${id}`}><RotateCcw size={17}/> Take again</Link>
      </section>
    </Shell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/create" element={<CreateQuiz/>}/>
      <Route path="/quiz/:id" element={<Quiz/>}/>
      <Route path="/result/:id" element={<Result/>}/>
      <Route path="/leaderboard/:id" element={<Leaderboard/>}/>
      <Route path="*" element={<Home/>}/>
    </Routes>
  );
}