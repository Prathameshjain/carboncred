from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0005_project_blockchain_minted_project_blockchain_tx_hash'),
    ]

    operations = [
        # ── Plantation numeric inputs ──────────────────────────────────────
        migrations.AddField(
            model_name='project',
            name='tree_count',
            field=models.PositiveIntegerField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='project',
            name='avg_dbh_mm',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Average Diameter at Breast Height in millimeters'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='avg_height_cm',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Average tree height in centimeters'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='species_factor',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Species wood density factor 1-100 e.g. Teak=70 Softwood=40'
            ),
        ),

        # ── Solar numeric inputs ───────────────────────────────────────────
        migrations.AddField(
            model_name='project',
            name='energy_generated_kwh',
            field=models.BigIntegerField(
                null=True, blank=True,
                help_text='Annual energy generated in kWh'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='grid_emission_factor',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Scaled grid emission factor e.g. 715 means 0.715 kg CO2/kWh'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='solar_efficiency_pct',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Panel efficiency percentage e.g. 98 means 98 percent'
            ),
        ),

        # ── Methane numeric inputs ─────────────────────────────────────────
        migrations.AddField(
            model_name='project',
            name='biogas_volume_m3_year',
            field=models.DecimalField(
                max_digits=14, decimal_places=2, null=True, blank=True,
                help_text='Annual biogas produced in cubic meters per year'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='methane_fraction_pct',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Methane content percentage e.g. 60 means 60 percent'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='biogas_plant_capacity_kw',
            field=models.DecimalField(
                max_digits=10, decimal_places=2, null=True, blank=True
            ),
        ),

        # ── Cookstove numeric inputs ───────────────────────────────────────
        migrations.AddField(
            model_name='project',
            name='stoves_count',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Number of stoves distributed and verified'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='wood_saved_kg_per_stove_year',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Wood saved per stove per year in kg'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='fnrb_scaled',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Fraction of Non-Renewable Biomass scaled e.g. 85 means 85 percent'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='wood_emission_factor_scaled',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Emission factor of wood scaled e.g. 150 means 1.5 kg CO2 per kg'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='cookstove_efficiency_pct',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Stove usage rate percentage e.g. 90 means 90 percent'
            ),
        ),

        # ── Wind numeric inputs ────────────────────────────────────────────
        migrations.AddField(
            model_name='project',
            name='wind_energy_generated_kwh',
            field=models.BigIntegerField(
                null=True, blank=True,
                help_text='Annual wind energy generated in kWh'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='wind_grid_emission_factor',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Scaled grid emission factor same as solar'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='wind_turbine_efficiency_pct',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Turbine efficiency percentage'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='wind_turbine_count',
            field=models.PositiveIntegerField(null=True, blank=True),
        ),

        # ── Computed output fields ─────────────────────────────────────────
        migrations.AddField(
            model_name='project',
            name='formula_computed_credits',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Credits computed by domain formula before ML cross-check'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='ml_estimated_credits',
            field=models.PositiveIntegerField(
                null=True, blank=True,
                help_text='Credits estimated by ML image analysis for cross-check'
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='cross_check_gap_pct',
            field=models.DecimalField(
                max_digits=8, decimal_places=2, null=True, blank=True,
                help_text='Percentage gap between formula and ML estimate'
            ),
        ),

        # ── Widen classification field to accommodate new 10-char values ───
        migrations.AlterField(
            model_name='project',
            name='classification',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('SOLAR',      'Solar'),
                    ('VEGETATION', 'Vegetation'),
                    ('PLANTATION', 'Plantation'),
                    ('METHANE',    'Methane'),
                    ('COOKSTOVE',  'Cookstove / ICS'),
                    ('WIND',       'Wind Energy'),
                ],
            ),
        ),
    ]
