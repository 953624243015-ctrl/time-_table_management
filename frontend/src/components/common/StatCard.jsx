const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle, trend }) => {
  const colors = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-500 text-green-600 bg-green-50 dark:bg-green-900/20',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    orange: 'bg-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    red: 'bg-red-500 text-red-600 bg-red-50 dark:bg-red-900/20',
    indigo: 'bg-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
    teal: 'bg-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20',
    pink: 'bg-pink-500 text-pink-600 bg-pink-50 dark:bg-pink-900/20',
  };
  const [iconBg, iconText, cardBg] = colors[color]?.split(' ') || colors.blue.split(' ');

  return (
    <div className="card p-6 hover:shadow-md transition-shadow duration-200 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-14 h-14 rounded-2xl ${cardBg} flex items-center justify-center`}>
          <Icon className={`w-7 h-7 ${iconText}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-slate-400">from last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
