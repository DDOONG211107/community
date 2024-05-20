import redis

r = redis.Redis(host='localhost', port=6379, db=0)

# todayUsers 키를 삭제하는 함수
def clear_today_users():
    r.delete("todayUsers")
    print("hello")

# 함수를 호출하여 실행합니다.
clear_today_users()

