#!/usr/bin/env python3
"""天命国策 · 社区增强 E2E 测试（20 项）
   覆盖：标签 / 搜索 / 收藏 / 关注 / 通知 / 精选 / 新板块"""
import json,urllib.request,urllib.error,random,string,time
BASE='http://localhost:3000'
PASS=FAIL=0
t0=time.time()
def http(path,data=None,method=None,token=None):
    url=BASE+path
    headers={'Content-Type':'application/json'}
    if token: headers['Authorization']='Bearer '+token
    if method=='POST' and data is None: data={}
    body=json.dumps(data).encode() if data is not None else None
    m=method or ('POST' if body else 'GET')
    req=urllib.request.Request(url,data=body,headers=headers,method=m)
    try:
        with urllib.request.urlopen(req,timeout=15) as r:
            raw=r.read().decode()
            try: return r.status,json.loads(raw)
            except: return r.status,raw
    except urllib.error.HTTPError as e:
        raw=e.read().decode()
        try: return e.code,json.loads(raw)
        except: return e.code,raw
def check(name,cond,detail=''):
    global PASS,FAIL
    if cond:
        PASS+=1; print(f'  ✅ {PASS:>2}. PASS {name}  {detail}')
    else:
        FAIL+=1; print(f'  ❌ {FAIL:>2}. FAIL {name}  {detail}')
def reg():
    u='c'+ ''.join(random.choices(string.ascii_lowercase,k=6))
    http('/api/register',{'username':u,'password':'P1234567'})
    c,r=http('/api/login',{'username':u,'password':'P1234567'})
    return r['user']['id'],r['token']
print('[社区增强 E2E]')
UID1,T1=reg(); UID2,T2=reg()
print(f'  U1={UID1} U2={UID2}')
# 1. 发带标签的帖子
c,r=http('/api/community/posts',{'board':'strategy','title':'洪武开局攻略：儒家+先修紫禁城','content':'选儒家开局，先修紫禁城','tags':['洪武','攻略','儒家']},'POST',T1)
check('发帖带3标签',c==200 and r.get('ok'),str(r))
pid1=r.get('postId')
# 2. 发新板块帖
c,r=http('/api/community/posts',{'board':'dynasty','title':'我的洪武王朝60年','content':'国祚一甲子','tags':['王朝','洪武']},'POST',T1)
check('发帖 dynasty 板块',c==200 and r.get('ok'))
# 3. 发 showoff 板块
c,r=http('/api/community/posts',{'board':'showoff','title':'国库500万截图','content':'富甲天下','tags':['国库','截图']},'POST',T2)
check('发帖 showoff 板块',c==200 and r.get('ok'))
# 4. 热门标签
c,r=http('/api/community/tags'); check('热门标签列表(≥3)',c==200 and len(r.get('tags',[]))>=3,f'tags={[t["tag"] for t in r.get("tags",[])]}')
# 5. 按标签筛选帖子
c,r=http(f'/api/community/posts?board=all&sort=new&page=1&tag={urllib.parse.quote("洪武")}')
check('按标签 #洪武 筛选(≥2)',c==200 and len(r.get('posts',[]))>=2,f'len={len(r.get("posts",[]))}')
# 6. 搜索帖子
c,r=http(f'/api/community/search?q={urllib.parse.quote("洪武")}'); check('搜索"洪武"(≥2)',c==200 and len(r.get('posts',[]))>=2,f'len={len(r.get("posts",[]))}')
# 7. 搜索不存在的关键词
c,r=http('/api/community/search?q=zzzznotfound'); check('搜索无结果',c==200 and len(r.get('posts',[]))==0)
# 8. 帖子列表返回 tags 字段
c,r=http('/api/community/posts?board=strategy&page=1')
has_tags = any(p.get('tags') for p in r.get('posts',[]))
check('帖子列表含 tags 字段',has_tags,f'first post tags={r.get("posts",[{}])[0].get("tags") if r.get("posts") else None}')
# 9. 收藏帖子
c,r=http(f'/api/community/posts/{pid1}/bookmark',method='POST',token=T2); check('U2 收藏 U1 帖子',c==200 and r.get('bookmarked')==True)
# 10. 重复收藏 → 取消
c,r=http(f'/api/community/posts/{pid1}/bookmark',method='POST',token=T2); check('U2 重复收藏→取消',c==200 and r.get('bookmarked')==False)
# 11. 再收藏回来
http(f'/api/community/posts/{pid1}/bookmark',method='POST',token=T2)
# 12. 我的收藏列表
c,r=http('/api/community/bookmarks',token=T2); check('U2 收藏列表(≥1)',c==200 and len(r.get('posts',[]))>=1,f'len={len(r.get("posts",[]))}')
# 13. 关注用户
c,r=http(f'/api/community/follow/{UID1}',method='POST',token=T2); check('U2 关注 U1',c==200 and r.get('following')==True)
# 14. 不能关注自己
c,r=http(f'/api/community/follow/{UID2}',method='POST',token=T2); check('不能关注自己',c==400 and r.get('error'))
# 15. 重复关注→取消
c,r=http(f'/api/community/follow/{UID1}',method='POST',token=T2); check('重复关注→取消',c==200 and r.get('following')==False)
# 16. 重新关注
http(f'/api/community/follow/{UID1}',method='POST',token=T2)
# 17. 关注列表
c,r=http('/api/community/following',token=T2); check('U2 关注列表(含U1)',c==200 and any(u['id']==UID1 for u in r.get('users',[])))
# 18. 粉丝列表
c,r=http(f'/api/community/followers?user_id={UID1}'); check('U1 粉丝列表(含U2)',c==200 and any(u['id']==UID2 for u in r.get('users',[])))
# 19. U2 评论 U1 帖子 → U1 收到通知
http(f'/api/community/posts/{pid1}/comments',{'content':'好攻略！学到了'},'POST',T2)
c,r=http('/api/notifications',token=T1); check('U1 收到评论通知',c==200 and any(n['type']=='comment' for n in r.get('notifications',[])))
# 20. U2 点赞 U1 帖子 → U1 收到点赞通知
http(f'/api/community/posts/{pid1}/like',method='POST',token=T2)
c,r=http('/api/notifications',token=T1); check('U1 收到点赞通知',c==200 and any(n['type']=='like' for n in r.get('notifications',[])))
# 21. 关注通知
c,r=http('/api/notifications',token=T1)
has_follow = any(n['type']=='follow' for n in r.get('notifications',[]))
check('U1 收到关注通知',has_follow)
# 22. 未读数
check('未读数>0',r.get('unread',0)>0,f'unread={r.get("unread")}')
# 23. 标记已读
c,r=http('/api/notifications/read',{},'POST',T1); check('标记全部已读',c==200 and r.get('ok'))
c,r=http('/api/notifications',token=T1); check('未读数=0',r.get('unread')==0,f'unread={r.get("unread")}')
# 24. 管理员精选
_,admin_t=http('/api/login',{'username':'admin','password':'admin123'})
at=admin_t['token']
c,r=http(f'/api/admin/posts/{pid1}/feature',method='POST',token=at); check('管理员加精置顶',c==200 and r.get('featured')==True)
# 25. 精选列表
c,r=http('/api/community/featured'); check('精选列表(≥1)',c==200 and len(r.get('posts',[]))>=1,f'len={len(r.get("posts",[]))}')
# 26. 取消精选
c,r=http(f'/api/admin/posts/{pid1}/feature',method='POST',token=at); check('取消精选',c==200 and r.get('featured')==False)
# 27. 帖子列表含 is_featured
c,r=http('/api/community/posts?board=strategy&page=1')
# 已取消精选 → 应该没有 featured
check('帖子 is_featured 字段存在',any('is_featured' in p for p in r.get('posts',[])))
# 28. promo.html 可访问
c,r=http('/promo.html'); check('宣传落地页 promo.html',c==200 and isinstance(r,str) and '天命' in r,f'HTTP {c}')
dt=time.time()-t0
print(f'\n======== 汇总 {dt:.1f}s ========')
print(f'PASS={PASS}  FAIL={FAIL}  总计={PASS+FAIL}')
import os; os._exit(0 if FAIL==0 else 2)
