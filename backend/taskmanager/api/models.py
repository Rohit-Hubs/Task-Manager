from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator

# ═══════════════════════════════════════════════════════════
# USER MODEL - Extends Django's AbstractUser with role field
# ═══════════════════════════════════════════════════════════
class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('member', 'Member'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    email = models.EmailField(
        blank=True,
        default='',
        validators=[EmailValidator(message="Enter a valid email address.")],
        help_text='Optional email address for the user'
    )

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.role})"

    def clean(self):
        """Model-level validation."""
        super().clean()
        if self.role not in dict(self.ROLE_CHOICES):
            raise ValidationError({'role': 'Invalid role. Must be admin or member.'})


# ═══════════════════════════════════════════════════════════
# PROJECT MODEL - Belongs to a User (creator), has many Tasks
# Relationships: Project → User (ForeignKey: created_by)
# ═══════════════════════════════════════════════════════════
class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='projects',
        help_text='The admin who created this project'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        # Prevent duplicate project names per creator
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'created_by'],
                name='unique_project_name_per_creator'
            )
        ]

    def __str__(self):
        return self.name

    def clean(self):
        """Model-level validation."""
        if self.name and len(self.name.strip()) == 0:
            raise ValidationError({'name': 'Project name cannot be blank.'})


# ═══════════════════════════════════════════════════════════
# TASK MODEL - Belongs to a Project and assigned to a User
# Relationships:
#   Task → Project (ForeignKey: project)
#   Task → User (ForeignKey: assigned_to)
# ═══════════════════════════════════════════════════════════
class Task(models.Model):
    STATUS = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    )
    PRIORITY = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text='The project this task belongs to'
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text='The team member assigned to this task'
    )
    status = models.CharField(max_length=15, choices=STATUS, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY, default='medium')
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        # Prevent duplicate task titles within the same project
        constraints = [
            models.UniqueConstraint(
                fields=['title', 'project'],
                name='unique_task_title_per_project'
            )
        ]

    def __str__(self):
        return f"{self.title} [{self.status}]"

    def clean(self):
        """Model-level validation."""
        if self.title and len(self.title.strip()) == 0:
            raise ValidationError({'title': 'Task title cannot be blank.'})

    @property
    def is_overdue(self):
        """Check if task is overdue (past due date and not completed)."""
        from django.utils import timezone
        if self.status in ['pending', 'in_progress'] and self.due_date:
            return self.due_date < timezone.now().date()
        return False