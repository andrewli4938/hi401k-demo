// src/App.tsx
console.log("App.tsx loaded")
import React, { useEffect, useMemo, useState } from 'react';
import {
  AppShell,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Loader,
  NumberInput,
  SegmentedControl,
  Slider,
  Stack,
  Text,
  Title,
  ThemeIcon,
  Divider,
  Badge,
} from '@mantine/core';
import { IconTrendingUp, IconPercentage, IconCurrencyDollar } from '@tabler/icons-react';

type ContributionType = 'percent' | 'dollar';

interface ContributionSettings {
  contributionType: ContributionType;
  contributionValue: number; // percent or dollar per paycheck depending on type
}

interface YtdSummary {
  salaryAnnual: number;
  ytdContribution: number;
  paychecksPerYear: number;
  age: number;
  retirementAge: number;
}

const DEFAULT_SETTINGS: ContributionSettings = {
  contributionType: 'percent',
  contributionValue: 6,
};

const DEFAULT_YTD: YtdSummary = {
  salaryAnnual: 90000,
  ytdContribution: 5400,
  paychecksPerYear: 24,
  age: 30,
  retirementAge: 65,
};

const API_BASE_URL = 'http://localhost:8000';

const App: React.FC = () => {
  const [settings, setSettings] = useState<ContributionSettings | null>(null);
  const [ytd, setYtd] = useState<YtdSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentContributionRate, setCurrentContributionRate] = useState<ContributionSettings | null>(DEFAULT_SETTINGS);

  // --- Load current contribution settings + YTD data from backend (or use mock) ---
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace these with real FastAPI endpoints
        const [settingsRes, ytdRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/contribution`),
          fetch(`${API_BASE_URL}/api/ytd_summary`),
        ]);

        if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
          const data = await settingsRes.value.json();
          setSettings({
            contributionType: data.contributionType ?? DEFAULT_SETTINGS.contributionType,
            contributionValue: data.contributionValue ?? DEFAULT_SETTINGS.contributionValue,
          });
        } else {
          // Fallback to mock default if backend not ready
          setSettings(DEFAULT_SETTINGS);
        }

        if (ytdRes.status === 'fulfilled' && ytdRes.value.ok) {
          const data = await ytdRes.value.json();
          setYtd({
            salaryAnnual: data.salaryAnnual ?? DEFAULT_YTD.salaryAnnual,
            ytdContribution: data.ytdContribution ?? DEFAULT_YTD.ytdContribution,
            paychecksPerYear: data.paychecksPerYear ?? DEFAULT_YTD.paychecksPerYear,
            age: data.age ?? DEFAULT_YTD.age,
            retirementAge: data.retirementAge ?? DEFAULT_YTD.retirementAge
          });
        } else {
          setYtd(DEFAULT_YTD);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load data. Using mock values.');
        setSettings(DEFAULT_SETTINGS);
        setYtd(DEFAULT_YTD);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleTypeChange = (value: string) => {
    if (!settings) return;
    const newType = value as ContributionType;
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            contributionType: newType,
          }
        : prev,
    );
    setSaveSuccess(false);
  };

  const handleValueChange = (value: number | string) => {
    if (!settings) return;
    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(numeric)) return;
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            contributionValue: numeric,
          }
        : prev,
    );
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    console.log("saving settings")
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      // TODO: implement this in FastAPI
      const res = await fetch(`${API_BASE_URL}/api/contribution`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error(`Save failed: ${res.status}`);
      }

      setSaveSuccess(true);
      setCurrentContributionRate(settings);
    } catch (e) {
      console.error(e);
      setError('Failed to save contribution settings.');
    } finally {
      setSaving(false);
    }
  };

  // --- Projection logic (very rough, just to demonstrate the idea) ---
  const projection = useMemo(() => {
    if (!settings || !ytd) return null;

    const yearsToRetirement = Math.max(0, ytd.retirementAge - ytd.age);
    const annualSalary = ytd.salaryAnnual;
    const paychecksPerYear = ytd.paychecksPerYear;
    const contributionType = settings.contributionType;
    const contributionValue = settings.contributionValue;

    // Current rate in percent (if dollar, convert based on salary)
    const currentPercent =
      contributionType === 'percent'
        ? contributionValue
        : (contributionValue * paychecksPerYear * 100) / annualSalary;

    // Hypothetical "current + 1%" scenario
    const increasedPercent = currentPercent + 1;

    // Super simple compound growth mock:
    const assumedReturn = 0.06;
    const annualContributionCurrent = (currentPercent / 100) * annualSalary;
    const annualContributionIncreased = (increasedPercent / 100) * annualSalary;

    const futureValue = (annual: number) => {
      // Future value of an annuity: A * [((1+r)^n - 1) / r]
      if (assumedReturn <= 0 || yearsToRetirement <= 0) return annual * yearsToRetirement;
      const factor = (Math.pow(1 + assumedReturn, yearsToRetirement) - 1) / assumedReturn;
      return annual * factor;
    };

    const currentBalanceAtRetirement = futureValue(annualContributionCurrent);
    const increasedBalanceAtRetirement = futureValue(annualContributionIncreased);
    const incrementalGain = increasedBalanceAtRetirement - currentBalanceAtRetirement;

    return {
      yearsToRetirement,
      currentPercent,
      increasedPercent,
      currentBalanceAtRetirement,
      increasedBalanceAtRetirement,
      incrementalGain,
    };
  }, [settings, ytd]);

  if (loading || !settings || !ytd) {
    return (
      <Container size="lg" py="xl">
        <Group justify="center" mt="xl">
          <Loader />
          <Text>Loading contribution data…</Text>
        </Group>
      </Container>
    );
  }

  const isPercent = settings.contributionType === 'percent';

  const sliderMax = isPercent ? 30 : 3000;
  const sliderStep = isPercent ? 0.5 : 25;

  return (
    <AppShell>
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Group align="flex-start" justify="space-between">
            <div>
              <Title order={2}>401(k) Contribution Settings</Title>
              <Text c="dimmed" mt={4}>
                Choose how much of each paycheck you want to invest toward retirement and see the
                impact over time.
              </Text>
            </div>
            <Badge size="lg" variant="light">
              Mock user • Age {ytd.age}
            </Badge>
          </Group>

          {error && (
            <Card shadow="xs" withBorder>
              <Text c="red">{error}</Text>
            </Card>
          )}

          {/* Top summary: salary + YTD */}
          <Group grow align="stretch">
            <Card withBorder shadow="xs" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Annual salary
                </Text>
                <Text fw={600} size="lg">
                  ${ytd.salaryAnnual.toLocaleString()}
                </Text>
                <Text size="xs" c="dimmed">
                  {ytd.paychecksPerYear} paychecks per year
                </Text>
              </Stack>
            </Card>

            <Card withBorder shadow="xs" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Year-to-date 401(k) contributions
                </Text>
                <Text fw={600} size="lg">
                  ${ytd.ytdContribution.toLocaleString()}
                </Text>
                <Text size="xs" c="dimmed">
                  Through current paycheck
                </Text>
              </Stack>
            </Card>

            <Card withBorder shadow="xs" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Current contribution rate
                </Text>
                <Text fw={600} size="lg">
                  {/* TODO: Replace this with a default value that the user previously had */}
                  {(currentContributionRate?.contributionType === 'percent')
                    ? `${currentContributionRate.contributionValue.toFixed(1)}% of paycheck`
                    : `$${currentContributionRate?.contributionValue.toFixed(0) || '0'} per paycheck`}
                  {/*isPercent
                    ? `${settings.contributionValue.toFixed(1)}% of paycheck`
                    : `$${settings.contributionValue.toFixed(0)} per paycheck`*/}
                </Text>
                <Text size="xs" c="dimmed">
                  Pretax / Roth split not modeled in this prototype
                </Text>
              </Stack>
            </Card>
          </Group>

          <Divider my="md" />

          {/* Contribution controls */}
          <Card withBorder shadow="sm" radius="md">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <ThemeIcon variant="light">
                    {isPercent ? <IconPercentage size={18} /> : <IconCurrencyDollar size={18} />}
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>Contribution per paycheck</Text>
                    <Text size="sm" c="dimmed">
                      Choose whether to contribute a percentage of your pay or a fixed amount.
                    </Text>
                  </div>
                </Group>
              </Group>

              <SegmentedControl
                value={settings.contributionType}
                onChange={handleTypeChange}
                data={[
                  { label: 'Percent of paycheck', value: 'percent' },
                  { label: 'Dollar amount', value: 'dollar' },
                ]}
              />

              <Flex gap="md" align="center" direction={{ base: 'column', sm: 'row' }}>
                <Slider
                  style={{ flex: 1 }}
                  min={0}
                  max={sliderMax}
                  step={sliderStep}
                  value={settings.contributionValue}
                  onChange={handleValueChange}
                  marks={
                    isPercent
                      ? [
                          { value: 0, label: '0%' },
                          { value: 5, label: '5%' },
                          { value: 10, label: '10%' },
                          { value: 15, label: '15%' },
                          { value: 20, label: '20%' },
                        ]
                      : [
                          { value: 0, label: '$0' },
                          { value: 500, label: '$500' },
                          { value: 1000, label: '$1k' },
                          { value: 2000, label: '$2k' },
                        ]
                  }
                />

                <NumberInput
                  style={{ width: 220 }}
                  label={isPercent ? 'Contribution (%)' : 'Contribution ($ per paycheck)'}
                  value={settings.contributionValue}
                  onChange={handleValueChange}
                  min={0}
                  max={sliderMax}
                  step={sliderStep}
                  suffix={isPercent ? '%' : ''}
                  thousandSeparator=","
                />
              </Flex>

              <Group justify="space-between" mt="md">
                <Button
                  onClick={handleSave}
                  loading={saving}
                  disabled={saving}
                >
                  Save contribution rate
                </Button>
                {saveSuccess && (
                  <Text size="sm" c="teal">
                    Saved! Your new contribution will apply to the next paycheck.
                  </Text>
                )}
              </Group>
            </Stack>
          </Card>

          {/* Impact / projection card */}
          {projection && (
            <Card withBorder shadow="xs" radius="md">
              <Group align="flex-start" gap="md">
                <ThemeIcon variant="light" size="lg" radius="xl">
                  <IconTrendingUp size={20} />
                </ThemeIcon>
                <Stack gap={4}>
                  <Text fw={600}>Long-term impact</Text>
                  <Text size="sm" c="dimmed">
                    If you’re {ytd.age} today and retire at {ytd.retirementAge},{' '}
                    increasing your contribution by just 1% could grow your retirement balance
                    significantly over {projection.yearsToRetirement} years (assuming a 6% annual
                    return).
                  </Text>

                  <Group gap="lg" mt="xs" wrap="wrap">
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">
                        Current estimated balance at retirement
                      </Text>
                      <Text fw={600}>
                        ${projection.currentBalanceAtRetirement.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Text>
                    </Stack>

                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">
                        With +1% contribution
                      </Text>
                      <Text fw={600}>
                        ${projection.increasedBalanceAtRetirement.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Text>
                    </Stack>

                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">
                        Incremental gain by retirement
                      </Text>
                      <Text fw={700} c="teal">
                        +$
                        {projection.incrementalGain.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                    </Stack>
                  </Group>

                  <Text size="xs" c="dimmed" mt="xs">
                    This is a simplified illustration, not investment advice. In a production system,
                    these assumptions and projections would be more sophisticated and fully
                    explained.
                  </Text>
                </Stack>
              </Group>
            </Card>
          )}
        </Stack>
      </Container>
    </AppShell>
  );
};

export default App;