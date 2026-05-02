from django.contrib import admin
from .models import User, Project, Task

# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'created_at']
    search_fields = ['name']

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'assigned_to', 'status', 'priority', 'due_date']
    list_filter = ['status', 'priority']
    search_fields = ['title']
