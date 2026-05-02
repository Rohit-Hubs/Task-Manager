from django.urls import path
from .views import (
    signup, get_me, create_project, get_projects, get_project_detail,
    update_project, delete_project, create_task, get_tasks, update_task,
    delete_task, get_users, update_user_role, delete_user, get_dashboard_stats
)
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    # ── Auth ──
    path('signup/', signup),
    path('login/', TokenObtainPairView.as_view()),
    path('me/', get_me),

    # ── Projects (Admin: full CRUD, Member: read only) ──
    path('projects/', create_project),
    path('projects/list/', get_projects),
    path('projects/<int:pk>/', get_project_detail),
    path('projects/<int:pk>/update/', update_project),
    path('projects/<int:pk>/delete/', delete_project),

    # ── Tasks (Admin: full CRUD, Member: create own + update status) ──
    path('tasks/create/', create_task),
    path('tasks/', get_tasks),
    path('tasks/<int:pk>/update/', update_task),
    path('tasks/<int:pk>/delete/', delete_task),

    # ── Users (Admin: manage roles & delete, Member: view list) ──
    path('users/', get_users),
    path('users/<int:pk>/role/', update_user_role),
    path('users/<int:pk>/delete/', delete_user),

    # ── Dashboard ──
    path('dashboard/', get_dashboard_stats),
]