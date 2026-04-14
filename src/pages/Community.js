import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MessageCircle, User, BadgeCheck, Trash2, Mic, 
  ImageIcon, Home, XCircle, Send, Heart, Volume2, Plus
} from 'lucide-react';

const Community = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const [posts, setPosts] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [formData, setFormData] = useState({ text: "", village: "Thimmayyapalem", crop: "Paddy", image: null });
  const [following, setFollowing] = useState([]);
  const [replyText, setReplyText] = useState({});

  const currentUser = "V. Eswararao";
 
  const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/community/posts`;
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(API_URL);
        setPosts(res.data);
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };
    fetchPosts();
    
    const savedFollows = localStorage.getItem('farmer_follows');
    if (savedFollows) setFollowing(JSON.parse(savedFollows));
  }, [API_URL]);

  const toBase64 = (blob) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400; canvas.height = 250;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 400, 250);
        setFormData({ ...formData, image: canvas.toDataURL('image/jpeg', 0.6) });
      };
    };
  };

  const toggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioURL(await toBase64(audioBlob));
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) { alert("Mic Permission Denied!"); }
    }
  };

  
  const handlePostSubmit = async () => {
    if (!formData.text && !formData.image && !audioURL) return;
    
    const postObj = {
      user: currentUser,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: formData.text,
      image: formData.image,
      audio: audioURL,
      village: formData.village,
      likes: 0,
      comments: []
    };

    try {
      const res = await axios.post(API_URL, postObj);
      setPosts([res.data, ...posts]);
      setFormData({ ...formData, text: "", image: null });
      setAudioURL(null);
    } catch (err) {
      alert("Error saving post!");
    }
  };

  
  const toggleLike = (postId) => {
    const updatedPosts = posts.map(p => {
      if (p._id === postId) {
        const isCurrentlyLiked = p.liked || false;
        return { 
          ...p, 
          liked: !isCurrentlyLiked, 
          likes: !isCurrentlyLiked ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 1) - 1) 
        };
      }
      return p;
    });
    setPosts(updatedPosts);
    
  };

  
  const submitReply = (postId) => {
    if (!replyText[postId]) return;
    const updatedPosts = posts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), { user: currentUser, text: replyText[postId] }],
          showReplyBox: false
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    setReplyText({ ...replyText, [postId]: "" });
  };

  
  const deletePost = async (postId) => {
    if (window.confirm("ఈ పోస్ట్‌ను శాశ్వతంగా డిలీట్ చేయాలా?")) {
      try {
        await axios.delete(`${API_URL}/${postId}`);
        setPosts(posts.filter(p => p._id !== postId));
      } catch (err) {
        alert("Error deleting post!");
      }
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <h1 style={styles.mainHeading}>Farmer <span style={{color:'#10b981'}}>Chat Hub</span></h1>

      <div style={styles.topGrid}>
        {/* 1. Profile Box */}
        <div style={styles.miniProfile}>
          <div style={styles.avatarLarge}><User size={24} color="#ffffff"/></div>
          <h3 style={styles.uName}>{currentUser}</h3>
          <p style={styles.uSub}>Thimmayyapalem Member</p>
          <button onClick={() => navigate('/')} style={styles.homeBtn}><Home size={14}/> Dashboard</button>
        </div>

        {/* 2. Wide Input Box */}
        <div style={styles.inputCard}>
          <textarea 
            placeholder="Hi everyone, let's discuss about farming today..." 
            style={styles.mainTextArea} 
            value={formData.text} 
            onChange={(e)=>setFormData({...formData, text: e.target.value})}
          />
          <div style={styles.inputActions}>
             <div style={{display:'flex', gap:'10px'}}>
                <button onClick={() => fileInputRef.current.click()} style={styles.iconBtn}><ImageIcon size={18} color="#10b981"/></button>
                <button onClick={toggleRecord} style={{...styles.iconBtn, color: isRecording ? 'red' : '#10b981'}}><Mic size={18}/></button>
             </div>
             <div style={styles.prevArea}>
                {formData.image && <div style={styles.smallPrev}><img src={formData.image} style={styles.fillImg} alt="p"/><XCircle size={10} style={styles.absDel} onClick={()=>setFormData({...formData, image:null})}/></div>}
                {audioURL && <div style={styles.smallPrev}><Volume2 size={12} color="#10b981"/><XCircle size={10} style={styles.absDel} onClick={()=>setAudioURL(null)}/></div>}
             </div>
             <button onClick={handlePostSubmit} style={styles.postBtn}><Send size={14}/> Share Now</button>
          </div>
          <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
        </div>

        {/* 3. Members Box */}
        <div style={styles.suggestCard}>
          <h4 style={styles.cardTitle}>Village Members</h4>
          <div style={styles.suggestList}>
            {[ {id:1, n:"V. Srinivasarao"}, {id:2, n:"V. Subbarao"}, {id:3, n:"V. Renu"} ].map(u => (
              <div key={u.id} style={styles.miniFollowRow}>
                <div style={styles.avatarMini}><User size={10} color="white"/></div>
                <span style={styles.fNameMini}>{u.n}</span>
                <button 
                  onClick={() => setFollowing(prev => prev.includes(u.id)?prev.filter(i=>i!==u.id):[...prev, u.id])}
                  style={{...styles.plusBtn, background: following.includes(u.id)?'#f1f5f9':'#10b981'}}
                >
                  {following.includes(u.id) ? '✓' : <Plus size={10} color="white"/>}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Post Feed */}
      <div style={styles.feedWrapper}>
        <h2 style={styles.feedHeading}>Thimmayyapalem <span style={{color:'#10b981'}}>Feed</span></h2>
        <main style={styles.feedGrid}>
          {posts.map(post => (
            <div key={post._id} style={styles.postCard}>
              <div style={styles.postHeader}>
                <div style={styles.avatarSm}><User size={12} color="white"/></div>
                <div style={{flex:1}}><p style={styles.pUserName}>{post.user} <BadgeCheck size={12} color="#10b981"/></p><p style={styles.pMeta}>{post.time} • Local Update</p></div>
                <Trash2 size={14} color="#cbd5e1" onClick={() => deletePost(post._id)} style={{cursor:'pointer'}}/>
              </div>
              <p style={styles.postText}>{post.content}</p>
              {post.image && <div style={styles.imgContainer}><img src={post.image} style={styles.postImg} alt="farm"/></div>}
              {post.audio && <div style={styles.audioBox}><audio src={post.audio} controls style={{width:'100%', height:'28px'}} /></div>}
              
              <div style={styles.interactionRow}>
                {/* Heart/Like Button */}
                <button 
                  style={{...styles.iBtn, color: post.liked ? '#ef4444' : '#64748b'}} 
                  onClick={() => toggleLike(post._id)}
                >
                  <Heart size={16} fill={post.liked ? '#ef4444' : 'none'}/> {post.likes || 0}
                </button>
                
                <button style={styles.iBtn} onClick={() => {
                  setPosts(posts.map(p => p._id === post._id ? {...p, showReplyBox: !p.showReplyBox} : p));
                }}>
                  <MessageCircle size={16}/> {post.comments?.length || 0} Comments
                </button>
              </div>

              {post.showReplyBox && (
                <div style={styles.replySection}>
                  <input 
                    type="text" 
                    placeholder="Type your comment..." 
                    style={styles.replyInput} 
                    value={replyText[post._id] || ""}
                    onChange={(e) => setReplyText({ ...replyText, [post._id]: e.target.value })}
                  />
                  <button onClick={() => submitReply(post._id)} style={styles.replySendBtn}><Send size={12}/></button>
                </div>
              )}

              {post.comments?.length > 0 && (
                <div style={styles.commentList}>
                  {post.comments.map((comment, index) => (
                    <div key={index} style={styles.commentItem}>
                      <b>{comment.user}:</b> {comment.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

// --- STYLES (Modern & Professional) ---
const styles = {
  pageWrapper: { background: '#f8fafc', minHeight: '100vh', padding: '40px 0', fontFamily: 'Inter, sans-serif' },
  mainHeading: { textAlign: 'center', marginBottom: '40px', fontWeight: '850', fontSize: '34px', color: '#1e293b' },
  topGrid: { display: 'grid', gridTemplateColumns: '180px 1fr 240px', gap: '30px', maxWidth: '1200px', margin: '0 auto 40px', padding: '0 20px', alignItems: 'start' },
  miniProfile: { background: '#ffffff', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  avatarLarge: { width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  uName: { fontSize: '18px', fontWeight: '700', margin: '0 0 4px', color: '#1e293b' },
  uSub: { fontSize: '13px', color: '#64748b', marginBottom: '20px' },
  homeBtn: { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' },
  inputCard: { background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  mainTextArea: { width: '100%', border: 'none', outline: 'none', fontSize: '16px', minHeight: '80px', resize: 'none', color: '#1e293b', lineHeight: '1.6' },
  inputActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' },
  iconBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '10px', borderRadius: '10px' },
  postBtn: { background: '#059669', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  suggestCard: { background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' },
  cardTitle: { fontSize: '14px', fontWeight: '700', margin: '0 0 20px', color: '#475569', textTransform: 'uppercase' },
  suggestList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  miniFollowRow: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' },
  avatarMini: { width: '30px', height: '30px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fNameMini: { fontSize: '14px', fontWeight: '600', flex: 1 },
  plusBtn: { border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  feedWrapper: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
  feedHeading: { fontSize: '22px', fontWeight: '800', marginBottom: '24px' },
  feedGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' },
  postCard: { background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  postHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  avatarSm: { width: '40px', height: '40px', background: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pUserName: { fontSize: '15px', fontWeight: '700', margin: 0 },
  pMeta: { fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' },
  postText: { fontSize: '15px', color: '#334155', marginBottom: '20px', lineHeight: '1.7' },
  imgContainer: { borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' },
  postImg: { width: '100%', height: '240px', objectFit: 'cover' },
  audioBox: { background: '#f8fafc', padding: '12px', borderRadius: '12px', marginBottom: '20px' },
  interactionRow: { display: 'flex', gap: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' },
  iBtn: { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', cursor: 'pointer', fontWeight: '600' },
  replySection: { marginTop: '15px', display: 'flex', gap: '10px' },
  replyInput: { flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' },
  replySendBtn: { background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' },
  commentList: { marginTop: '15px', background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '13px' },
  commentItem: { marginBottom: '5px' },
  prevArea: { display: 'flex', gap: '12px' },
  smallPrev: { position: 'relative', width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '8px' },
  fillImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' },
  absDel: { position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', borderRadius: '50%', color: 'white', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default Community;