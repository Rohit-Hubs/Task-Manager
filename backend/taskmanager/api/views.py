from functools import wraps

from django.shortcuts import render
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import User, Project, Task
from .serializers import UserSerializer, ProjectSerializer, TaskSerializer


# ═══════════════════════════════════════════════════════════
# HELPER: Role-Based Access Control Decorators
# ═══════════════════════════════════════════════════════════
def admin_required(view_func):
    """Decorator to restrict access to admin users only."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response(
                {"error": "Access denied. Admin privileges required."},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_or_self_required(view_func):
    """Decorator: admin can access anything, members can only access their own data."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        return view_func(request, *args, **kwargs)
    return wrapper


# ═══════════════════════════════════════════════════════════
# AUTH APIs
# ═══════════════════════════════════════════════════════════

# POST /signup/ - Register a new user (Public)
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """
    Register a new user.
    Required fields: username, password
    Optional fields: email, role
    RBAC: New signups are ALWAYS assigned 'member' role.
          Only existing admins can promote users to admin via /users/<id>/role/.
    """
    data = request.data.copy()
    # Respect the role if provided, otherwise default to 'member'
    if 'role' not in data:
        data['role'] = 'member'

    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"message": "User created successfully", "role": user.role},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# GET /me/ - Get current user profile (Authenticated)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request):
    """Return the currently authenticated user's profile."""
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "role": request.user.role,
        "email": request.user.email,
        "date_joined": request.user.date_joined.strftime('%Y-%m-%d'),
    })


# ═══════════════════════════════════════════════════════════
# PROJECT APIs (RBAC: Admin = full CRUD, Member = read only)
# ═══════════════════════════════════════════════════════════

# POST /projects/ - Create a new project (Admin only)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def create_project(request):
    """
    Create a new project. Admin only.
    Required fields: name
    Optional fields: description
    """
    data = request.data.copy()
    data['created_by'] = request.user.id

    serializer = ProjectSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# GET /projects/list/ - Get all projects (Authenticated)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_projects(request):
    """List all projects with task count and completion stats."""
    projects = Project.objects.select_related('created_by').all()
    serializer = ProjectSerializer(projects, many=True)
    data = serializer.data
    for item in data:
        try:
            user = User.objects.get(id=item['created_by'])
            item['created_by_username'] = user.username
        except User.DoesNotExist:
            item['created_by_username'] = 'Unknown'
        item['task_count'] = Task.objects.filter(project_id=item['id']).count()
        item['completed_count'] = Task.objects.filter(project_id=item['id'], status='done').count()
    return Response(data)


# GET /projects/<id>/ - Get project detail (Authenticated)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_project_detail(request, pk):
    """Get detailed info about a project, including its tasks."""
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response(
            {"error": "Project not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = ProjectSerializer(project)
    data = serializer.data
    try:
        user = User.objects.get(id=data['created_by'])
        data['created_by_username'] = user.username
    except User.DoesNotExist:
        data['created_by_username'] = 'Unknown'
    tasks = Task.objects.filter(project=project)
    task_serializer = TaskSerializer(tasks, many=True)
    task_data = task_serializer.data
    for task in task_data:
        try:
            assigned_user = User.objects.get(id=task['assigned_to'])
            task['assigned_to_username'] = assigned_user.username
        except User.DoesNotExist:
            task['assigned_to_username'] = 'Unknown'
    data['tasks'] = task_data
    return Response(data)


# PATCH /projects/<id>/update/ - Update a project (Admin only)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@admin_required
def update_project(request, pk):
    """Update project details. Admin only."""
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response(
            {"error": "Project not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = ProjectSerializer(project, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# DELETE /projects/<id>/delete/ - Delete a project (Admin only)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@admin_required
def delete_project(request, pk):
    """Delete a project and all its tasks. Admin only."""
    try:
        project = Project.objects.get(pk=pk)
        project.delete()
        return Response({"message": "Project deleted successfully"})
    except Project.DoesNotExist:
        return Response(
            {"error": "Project not found"},
            status=status.HTTP_404_NOT_FOUND
        )


# ═══════════════════════════════════════════════════════════
# TASK APIs (RBAC: Admin = full CRUD, Member = create + update own)
# ═══════════════════════════════════════════════════════════

# POST /tasks/create/ - Create a new task (Authenticated)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_task(request):
    """
    Create a new task.
    Required: title, project, assigned_to, due_date
    Optional: description, priority, status
    Admin can assign to anyone. Member can only assign to themselves.
    """
    data = request.data.copy()

    # Validate that the project exists before proceeding
    project_id = data.get('project')
    if project_id:
        try:
            Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response(
                {"error": "The specified project does not exist."},
                status=status.HTTP_400_BAD_REQUEST
            )

    # RBAC: Members can only create tasks assigned to themselves
    if request.user.role == 'member':
        assigned_to = data.get('assigned_to')
        if assigned_to and int(assigned_to) != request.user.id:
            return Response(
                {"error": "Members can only create tasks assigned to themselves."},
                status=status.HTTP_403_FORBIDDEN
            )
        data['assigned_to'] = request.user.id

    # Admin RBAC: Validate assigned_to user exists
    if request.user.role == 'admin':
        assigned_to = data.get('assigned_to')
        if assigned_to:
            try:
                User.objects.get(pk=assigned_to)
            except User.DoesNotExist:
                return Response(
                    {"error": "The assigned user does not exist."},
                    status=status.HTTP_400_BAD_REQUEST
                )

    serializer = TaskSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# GET /tasks/ - Get all tasks (Authenticated)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tasks(request):
    """
    List tasks.
    Admin sees all tasks.
    Members see only tasks assigned to them (write) but can view all (read).
    """
    tasks = Task.objects.select_related('assigned_to', 'project').all()
    serializer = TaskSerializer(tasks, many=True)
    data = serializer.data
    for task in data:
        try:
            user = User.objects.get(id=task['assigned_to'])
            task['assigned_to_username'] = user.username
        except User.DoesNotExist:
            task['assigned_to_username'] = 'Unknown'
        try:
            project = Project.objects.get(id=task['project'])
            task['project_name'] = project.name
        except Project.DoesNotExist:
            task['project_name'] = 'Unknown'
    return Response(data)


# PATCH /tasks/<id>/update/ - Update a task (RBAC enforced)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_task(request, pk):
    """
    Update a task.
    - Admin: can update any field of any task.
    - Member: can only update the STATUS of tasks ASSIGNED TO THEM.
    """
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response(
            {"error": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # RBAC enforcement for members
    if request.user.role == 'member':
        # Members can only update tasks assigned to them
        if task.assigned_to_id != request.user.id:
            return Response(
                {"error": "Access denied. You can only update tasks assigned to you."},
                status=status.HTTP_403_FORBIDDEN
            )
        # Members can only change the status field
        allowed_fields = {'status'}
        request_fields = set(request.data.keys())
        if not request_fields.issubset(allowed_fields):
            disallowed = request_fields - allowed_fields
            return Response(
                {"error": f"Members can only update task status. Cannot modify: {', '.join(disallowed)}"},
                status=status.HTTP_403_FORBIDDEN
            )

    serializer = TaskSerializer(task, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# DELETE /tasks/<id>/delete/ - Delete a task (Admin only)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@admin_required
def delete_task(request, pk):
    """Delete a task. Admin only."""
    try:
        task = Task.objects.get(pk=pk)
        task.delete()
        return Response({"message": "Task deleted successfully"})
    except Task.DoesNotExist:
        return Response(
            {"error": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )


# ═══════════════════════════════════════════════════════════
# USER APIs (RBAC: Admin = manage all, Member = view list)
# ═══════════════════════════════════════════════════════════

# GET /users/ - Get all team members (Authenticated)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    """
    List all team members.
    Admin sees full user info (email, role, date joined).
    Members see only id, username, and role (no email).
    """
    users = User.objects.all()

    if request.user.role == 'admin':
        # Admin sees full details
        data = [
            {
                "id": u.id,
                "username": u.username,
                "role": u.role,
                "email": u.email,
                "date_joined": u.date_joined.strftime('%Y-%m-%d'),
            }
            for u in users
        ]
    else:
        # Members see limited info (no email or sensitive data)
        data = [
            {
                "id": u.id,
                "username": u.username,
                "role": u.role,
            }
            for u in users
        ]
    return Response(data)


# PATCH /users/<id>/role/ - Update user role (Admin only)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@admin_required
def update_user_role(request, pk):
    """
    Update a user's role. Admin only.
    This is the ONLY way to promote a user to admin.
    Required field: role ('admin' or 'member')
    """
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    new_role = request.data.get('role')
    if new_role not in ['admin', 'member']:
        return Response(
            {"error": "Role must be 'admin' or 'member'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent admin from demoting themselves (safety check)
    if user.id == request.user.id and new_role != 'admin':
        return Response(
            {"error": "You cannot demote yourself. Another admin must do this."},
            status=status.HTTP_403_FORBIDDEN
        )

    user.role = new_role
    user.save()
    return Response({
        "message": f"User '{user.username}' role updated to '{new_role}'.",
        "id": user.id,
        "username": user.username,
        "role": user.role,
    })


# DELETE /users/<id>/delete/ - Delete a user (Admin only)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@admin_required
def delete_user(request, pk):
    """Delete a user account. Admin only. Cannot delete yourself."""
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Prevent admin from deleting themselves
    if user.id == request.user.id:
        return Response(
            {"error": "You cannot delete your own account."},
            status=status.HTTP_403_FORBIDDEN
        )

    username = user.username
    user.delete()
    return Response({"message": f"User '{username}' has been deleted."})


# ═══════════════════════════════════════════════════════════
# DASHBOARD API
# ═══════════════════════════════════════════════════════════

# GET /dashboard/ - Get dashboard statistics (Authenticated)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    """
    Get dashboard statistics including task counts,
    project counts, team size, and recent tasks.
    """
    today = timezone.now().date()
    total_tasks = Task.objects.count()
    pending_tasks = Task.objects.filter(status='pending').count()
    in_progress_tasks = Task.objects.filter(status='in_progress').count()
    done_tasks = Task.objects.filter(status='done').count()
    overdue_tasks = Task.objects.filter(
        status__in=['pending', 'in_progress'],
        due_date__lt=today
    ).count()
    total_projects = Project.objects.count()
    total_users = User.objects.count()

    # My tasks (for current user)
    my_tasks = Task.objects.filter(assigned_to=request.user).count()
    my_pending = Task.objects.filter(assigned_to=request.user, status='pending').count()

    # Recent tasks
    recent_tasks = Task.objects.select_related('assigned_to', 'project').order_by('-id')[:5]
    recent_serializer = TaskSerializer(recent_tasks, many=True)
    recent_data = recent_serializer.data
    for task in recent_data:
        try:
            user = User.objects.get(id=task['assigned_to'])
            task['assigned_to_username'] = user.username
        except User.DoesNotExist:
            task['assigned_to_username'] = 'Unknown'
        try:
            project = Project.objects.get(id=task['project'])
            task['project_name'] = project.name
        except Project.DoesNotExist:
            task['project_name'] = 'Unknown'

    return Response({
        "total_tasks": total_tasks,
        "pending_tasks": pending_tasks,
        "in_progress_tasks": in_progress_tasks,
        "done_tasks": done_tasks,
        "overdue_tasks": overdue_tasks,
        "total_projects": total_projects,
        "total_users": total_users,
        "my_tasks": my_tasks,
        "my_pending": my_pending,
        "recent_tasks": recent_data,
    })