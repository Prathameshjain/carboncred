"""
analytics/views.py — All 15 analytics API endpoints.
User views require authentication; platform views are public.
"""

from collections import defaultdict
from datetime import datetime

from django.contrib.auth.models import User
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from transactions.models import Transaction
from marketplace.models import SellOrder

DOMAINS = ['PLANTATION', 'SOLAR', 'METHANE', 'COOKSTOVE', 'WIND']
STATUSES = ['VERIFIED', 'REVIEW_REQUIRED', 'REJECTED', 'PENDING']


def _month_label(dt):
    """Return month label like 'Jan 2025' from a date/datetime."""
    return dt.strftime('%b %Y')


# ─────────────────────────────────────────────────────────────────────────────
# USER ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────

class UserProjectStatusView(APIView):
    """Endpoint 1: Breakdown of user's projects by verification status."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Project.objects
            .filter(user=request.user)
            .values('final_decision')
            .annotate(count=Count('id'))
        )
        counts = {row['final_decision']: row['count'] for row in qs}
        labels = STATUSES
        values = [counts.get(s, 0) for s in labels]
        return Response({'labels': labels, 'values': values})


class UserProjectTypesView(APIView):
    """Endpoint 2: Breakdown of user's projects by classification."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Project.objects
            .filter(user=request.user)
            .values('classification')
            .annotate(count=Count('id'))
        )
        counts = {row['classification']: row['count'] for row in qs}
        labels = DOMAINS
        values = [counts.get(d, 0) for d in labels]
        return Response({'labels': labels, 'values': values})


class UserCO2OverTimeView(APIView):
    """Endpoint 3: Monthly CO₂ impact from user's verified projects (with cumulative)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Project.objects
            .filter(user=request.user, final_decision='VERIFIED')
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(co2=Sum('estimated_co2_tco2_year'))
            .order_by('month')
        )
        result = []
        cumulative = 0.0
        for row in qs:
            co2 = float(row['co2'] or 0)
            cumulative += co2
            result.append({
                'month': _month_label(row['month']),
                'co2': round(co2, 2),
                'cumulative': round(cumulative, 2),
            })
        return Response({'data': result})


class UserCreditsPerProjectView(APIView):
    """Endpoint 4: Credits issued per verified project."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Project.objects
            .filter(user=request.user, final_decision='VERIFIED')
            .values('project_name', 'credits_issued', 'classification')
            .order_by('-credits_issued')
        )
        data = [
            {
                'project_name': row['project_name'],
                'credits': row['credits_issued'] or 0,
                'classification': row['classification'],
            }
            for row in qs
        ]
        return Response({'data': data})


class UserConfidenceScoresView(APIView):
    """Endpoint 5: ML confidence score per project."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Project.objects
            .filter(user=request.user)
            .exclude(confidence_score=None)
            .values('project_name', 'confidence_score', 'final_decision')
            .order_by('-confidence_score')
        )
        data = [
            {
                'project_name': row['project_name'],
                'confidence': round(float(row['confidence_score']) * 100, 1),
                'decision': row['final_decision'],
            }
            for row in qs
        ]
        return Response({'data': data})


class UserMarketplaceActivityView(APIView):
    """Endpoint 6: Monthly credits bought vs sold by user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sold_qs = (
            Transaction.objects
            .filter(seller=request.user)
            .annotate(month=TruncMonth('timestamp'))
            .values('month')
            .annotate(total=Sum('credits_transferred'))
            .order_by('month')
        )
        bought_qs = (
            Transaction.objects
            .filter(buyer=request.user)
            .annotate(month=TruncMonth('timestamp'))
            .values('month')
            .annotate(total=Sum('credits_transferred'))
            .order_by('month')
        )

        sold_map = {_month_label(r['month']): r['total'] for r in sold_qs}
        bought_map = {_month_label(r['month']): r['total'] for r in bought_qs}
        months = sorted(set(list(sold_map.keys()) + list(bought_map.keys())))

        data = [
            {
                'month': m,
                'credits_sold': sold_map.get(m, 0),
                'credits_bought': bought_map.get(m, 0),
            }
            for m in months
        ]
        return Response({'data': data})


class UserPnLView(APIView):
    """Endpoint 7: Monthly INR earned vs spent (P&L)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Earned: user is seller
        earned_qs = (
            Transaction.objects
            .filter(seller=request.user)
            .annotate(month=TruncMonth('timestamp'))
            .values('month', 'sell_order__price_per_credit')
            .annotate(credits=Sum('credits_transferred'))
            .order_by('month')
        )
        # Spent: user is buyer
        spent_qs = (
            Transaction.objects
            .filter(buyer=request.user)
            .annotate(month=TruncMonth('timestamp'))
            .values('month', 'sell_order__price_per_credit')
            .annotate(credits=Sum('credits_transferred'))
            .order_by('month')
        )

        earned_map = defaultdict(float)
        for r in earned_qs:
            label = _month_label(r['month'])
            earned_map[label] += float(r['credits'] or 0) * float(r['sell_order__price_per_credit'] or 0)

        spent_map = defaultdict(float)
        for r in spent_qs:
            label = _month_label(r['month'])
            spent_map[label] += float(r['credits'] or 0) * float(r['sell_order__price_per_credit'] or 0)

        months = sorted(set(list(earned_map.keys()) + list(spent_map.keys())))
        data = [
            {
                'month': m,
                'earned': round(earned_map.get(m, 0), 2),
                'spent': round(spent_map.get(m, 0), 2),
                'net': round(earned_map.get(m, 0) - spent_map.get(m, 0), 2),
            }
            for m in months
        ]
        return Response({'data': data})


# ─────────────────────────────────────────────────────────────────────────────
# PLATFORM ANALYTICS (public)
# ─────────────────────────────────────────────────────────────────────────────

class PlatformDomainDistributionView(APIView):
    """Endpoint 8: Verified project count by domain (platform-wide)."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = (
            Project.objects
            .filter(final_decision='VERIFIED')
            .values('classification')
            .annotate(count=Count('id'))
        )
        counts = {row['classification']: row['count'] for row in qs}
        return Response({
            'labels': DOMAINS,
            'values': [counts.get(d, 0) for d in DOMAINS],
        })


class PlatformCO2OverTimeView(APIView):
    """Endpoint 9: Monthly cumulative CO₂ by domain (platform-wide stacked)."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = (
            Project.objects
            .filter(final_decision='VERIFIED')
            .annotate(month=TruncMonth('created_at'))
            .values('month', 'classification')
            .annotate(co2=Sum('estimated_co2_tco2_year'))
            .order_by('month')
        )

        # Build month-indexed dict per domain
        domain_monthly = {d: defaultdict(float) for d in DOMAINS}
        all_months = set()
        for row in qs:
            label = _month_label(row['month'])
            all_months.add(label)
            d = row['classification']
            if d in DOMAINS:
                domain_monthly[d][label] += float(row['co2'] or 0)

        months = sorted(all_months)

        # Compute cumulative per domain
        series = {d: [] for d in DOMAINS}
        running = {d: 0.0 for d in DOMAINS}
        for m in months:
            for d in DOMAINS:
                running[d] += domain_monthly[d].get(m, 0)
                series[d].append(round(running[d], 2))

        return Response({'months': months, 'series': series})


class PlatformMonthlyProjectsView(APIView):
    """Endpoint 10: Monthly project submissions by verification outcome."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = (
            Project.objects
            .annotate(month=TruncMonth('created_at'))
            .values('month', 'final_decision')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        month_data = defaultdict(lambda: {s: 0 for s in STATUSES})
        all_months = set()
        for row in qs:
            label = _month_label(row['month'])
            all_months.add(label)
            s = row['final_decision']
            if s in STATUSES:
                month_data[label][s] += row['count']

        months = sorted(all_months)
        data = [{'month': m, **month_data[m]} for m in months]
        return Response({'data': data})


class PlatformVerificationByDomainView(APIView):
    """Endpoint 11: Verification outcome percentages per domain."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = (
            Project.objects
            .values('classification', 'final_decision')
            .annotate(count=Count('id'))
        )

        domain_counts = defaultdict(lambda: defaultdict(int))
        for row in qs:
            d = row['classification']
            if d in DOMAINS:
                domain_counts[d][row['final_decision']] += row['count']

        data = []
        for d in DOMAINS:
            total = sum(domain_counts[d].values()) or 1
            entry = {'domain': d}
            for s in ['VERIFIED', 'REVIEW_REQUIRED', 'REJECTED']:
                entry[s] = round(domain_counts[d].get(s, 0) / total * 100, 1)
            data.append(entry)

        return Response({'data': data})


class PlatformMarketplaceVolumeView(APIView):
    """Endpoint 12: Monthly marketplace trading volume (INR + credits)."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = (
            Transaction.objects
            .annotate(month=TruncMonth('timestamp'))
            .values('month', 'sell_order__price_per_credit')
            .annotate(credits=Sum('credits_transferred'))
            .order_by('month')
        )

        month_inr = defaultdict(float)
        month_credits = defaultdict(int)
        for row in qs:
            label = _month_label(row['month'])
            c = int(row['credits'] or 0)
            price = float(row['sell_order__price_per_credit'] or 0)
            month_credits[label] += c
            month_inr[label] += c * price

        months = sorted(set(list(month_credits.keys())))
        data = [
            {
                'month': m,
                'total_inr': round(month_inr[m], 2),
                'total_credits': month_credits[m],
            }
            for m in months
        ]
        return Response({'data': data})


class PlatformGrowthView(APIView):
    """Endpoint 13: Monthly cumulative platform growth (users, projects, credits)."""
    permission_classes = [AllowAny]

    def get(self, request):
        user_qs = (
            User.objects
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        project_qs = (
            Project.objects
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        credits_qs = (
            Project.objects
            .filter(final_decision='VERIFIED')
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Sum('credits_issued'))
            .order_by('month')
        )

        user_map = {_month_label(r['month']): r['count'] for r in user_qs}
        project_map = {_month_label(r['month']): r['count'] for r in project_qs}
        credits_map = {_month_label(r['month']): (r['total'] or 0) for r in credits_qs}

        months = sorted(set(list(user_map.keys()) + list(project_map.keys()) + list(credits_map.keys())))
        data = []
        cu, cp, cc = 0, 0, 0
        for m in months:
            cu += user_map.get(m, 0)
            cp += project_map.get(m, 0)
            cc += credits_map.get(m, 0)
            data.append({'month': m, 'users': cu, 'projects': cp, 'credits': cc})

        return Response({'data': data})


class PlatformCreditsByDomainView(APIView):
    """Endpoint 14: Monthly credits issued per domain (for stacked bar)."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = (
            Project.objects
            .filter(final_decision='VERIFIED')
            .annotate(month=TruncMonth('created_at'))
            .values('month', 'classification')
            .annotate(total=Sum('credits_issued'))
            .order_by('month')
        )

        domain_monthly = {d: defaultdict(int) for d in DOMAINS}
        all_months = set()
        for row in qs:
            label = _month_label(row['month'])
            all_months.add(label)
            d = row['classification']
            if d in DOMAINS:
                domain_monthly[d][label] += row['total'] or 0

        months = sorted(all_months)
        series = {d: [domain_monthly[d].get(m, 0) for m in months] for d in DOMAINS}
        return Response({'months': months, 'series': series})


class PlatformGeographicView(APIView):
    """Endpoint 15: Verified projects with coordinates for scatter map."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Project.objects.filter(
            final_decision='VERIFIED',
            project_latitude__isnull=False,
            project_longitude__isnull=False,
        ).values(
            'project_name', 'classification', 'credits_issued',
            'project_latitude', 'project_longitude',
        )
        projects = [
            {
                'project_name': r['project_name'],
                'classification': r['classification'],
                'credits_issued': r['credits_issued'] or 0,
                'latitude': float(r['project_latitude']),
                'longitude': float(r['project_longitude']),
            }
            for r in qs
        ]
        return Response({'projects': projects})
